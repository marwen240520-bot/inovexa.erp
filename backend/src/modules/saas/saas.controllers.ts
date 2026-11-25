import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../../common/audit/audit-log.entity';
import { AdminGuard } from './admin.guard';
import { SaasSettingsService } from './saas-settings.service';
import { SubscriptionService } from './subscription.service';
import { SectorsService } from './sectors.service';
import { MODULE_KEYS } from './account-access';
import { PAYMENT_METHODS } from './saas-defaults';

const actorId = (req: any): number => req.user.actorId ?? req.user.userId;

// ═════════════════════════════ Site public (sans connexion) ═════════════════════════════

/** Données affichées sur le site public : essai, formules publiées, secteurs, suggestions, prestations. Lecture seule. */
@ApiTags('Site public')
@Controller('public')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PublicController {
  constructor(
    private readonly settings: SaasSettingsService,
    private readonly subscriptions: SubscriptionService,
    private readonly sectors: SectorsService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: 'Durée de l’essai, devise, contacts, identifiant client Google (s’il est configuré)' })
  async config() {
    const s = await this.settings.get();
    return {
      trialHours: s.trialHours, currency: s.currency, vatRate: s.vatRate, requireEmailVerification: s.requireEmailVerification,
      supportEmail: s.supportEmail, supportPhone: s.supportPhone, supportWhatsapp: s.supportWhatsapp,
      googleClientId: this.settings.googleClientId(), modules: MODULE_KEYS,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Formules publiées (prix hors taxes ; null = sur devis)' })
  async plans() {
    const s = await this.settings.get();
    return { currency: s.currency, vatRate: s.vatRate, trialHours: s.trialHours, plans: await this.subscriptions.plans('public') };
  }

  @Get('sectors')
  sectorsList() {
    return this.sectors.list('public');
  }

  @Get('sectors/:code')
  @ApiOperation({ summary: 'Catalogue de suggestions d’un secteur (valeurs indicatives)' })
  sector(@Param('code') code: string) {
    return this.sectors.detail(String(code).toLowerCase(), 'public');
  }

  @Get('service-offers')
  offers(@Query('sector') sector?: string) {
    return this.sectors.offers('public', sector || null);
  }
}

// ═════════════════════════════ Abonnement de la société connectée ═════════════════════════════

/** Accessible même quand le compte est bloqué (essai terminé, suspension) : voir isAllowedWhenBlocked. */
@ApiTags('Abonnement')
@ApiBearerAuth()
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(
    private readonly settings: SaasSettingsService,
    private readonly subscriptions: SubscriptionService,
    private readonly sectors: SectorsService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  /** Seul le propriétaire du compte engage la société (paiement, résiliation). */
  private assertOwner(req: any) {
    if (req.user.isTeamMember || req.user.role !== 'client') throw new ForbiddenException('Seul le propriétaire du compte gère l’abonnement.');
  }

  @Get('subscription')
  @ApiOperation({ summary: 'État du compte, temps d’essai restant (horloge du serveur), formule, instructions de paiement' })
  async subscription(@Request() req: any) {
    const s = await this.settings.get();
    const owner = await this.subscriptions.owner(req.user.userId);
    const payments = await this.subscriptions.paymentsOf(owner.id);
    const teamCount = await this.users.count({ where: { ownerId: owner.id, isActive: true } });
    const plans = await this.subscriptions.plans('public');
    return {
      account: this.subscriptions.view(owner, s),
      company: { name: owner.companyName, email: owner.email },
      plan: plans.find((p) => p.code === owner.planCode) || null,
      users: { used: 1 + teamCount, limit: owner.userLimit ?? null },
      modules: owner.modules || {},
      pendingPayment: payments.find((p) => p.status === 'pending') || null,
      payment: { currency: s.currency, vatRate: s.vatRate, instructions: s.paymentInstructions, methods: s.paymentMethods?.length ? s.paymentMethods : ['bank_transfer'], onlinePayment: false },
      support: { email: s.supportEmail, phone: s.supportPhone, whatsapp: s.supportWhatsapp },
      canManage: !req.user.isTeamMember,
    };
  }

  @Get('plans')
  async plans() {
    const s = await this.settings.get();
    return { currency: s.currency, vatRate: s.vatRate, plans: await this.subscriptions.plans('public') };
  }

  @Get('payments')
  payments(@Request() req: any) {
    return this.subscriptions.paymentsOf(req.user.userId);
  }

  @Post('payments')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Déclare un paiement (virement, espèces, chèque…) à faire valider par l’administrateur' })
  declare(@Request() req: any, @Body() body: any) {
    this.assertOwner(req);
    if (!body?.planCode || !(PAYMENT_METHODS as readonly string[]).includes(body?.method)) throw new BadRequestException('Formule et moyen de paiement requis.');
    return this.subscriptions.declarePayment(req.user.userId, body, { role: 'client', actorId: actorId(req) });
  }

  @Delete('payments/:id')
  cancelPayment(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    this.assertOwner(req);
    return this.subscriptions.cancelOwnPayment(req.user.userId, id);
  }

  @Get('payments/:id/receipt')
  receipt(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.receipt(req.user.userId, id);
  }

  @Post('contact')
  @HttpCode(200)
  @ApiOperation({ summary: 'Écrit à l’administrateur de la plateforme' })
  contact(@Request() req: any, @Body() body: any) {
    return this.subscriptions.contactAdmin(req.user.userId, actorId(req), body?.subject, body?.message);
  }

  @Post('cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Résilie l’abonnement (mot de passe requis). Les données sont conservées.' })
  async cancel(@Request() req: any, @Body() body: any) {
    this.assertOwner(req);
    const owner = await this.subscriptions.owner(req.user.userId);
    if (!(await bcrypt.compare(String(body?.password || ''), owner.password))) throw new ForbiddenException('Mot de passe incorrect.');
    return this.subscriptions.cancel(owner.id, body?.reason, actorId(req));
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Suggestions du secteur de la société (ou d’un autre secteur avec ?sector=)' })
  async suggestions(@Request() req: any, @Query('sector') sector?: string) {
    const owner = await this.subscriptions.owner(req.user.userId);
    const list = await this.sectors.list('public');
    const code = (sector || owner.sector || list[0]?.code || '').toLowerCase();
    return { sectors: list.map((s) => ({ code: s.code, name: s.name, nameEn: s.nameEn, nameAr: s.nameAr, itemCount: s.itemCount })), current: code, ...(code ? await this.sectors.detail(code, 'public') : {}) };
  }
}

/** Copie de suggestions dans les produits de la société : c'est une écriture dans l'ERP, donc fermée aux comptes bloqués. */
@ApiTags('Suggestions par secteur')
@ApiBearerAuth()
@Controller('products/suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private readonly sectors: SectorsService) {}

  @Post('import')
  @ApiOperation({ summary: 'Crée dans la société les produits correspondant aux suggestions choisies' })
  import(@Request() req: any, @Body() body: any) {
    return this.sectors.importToCompany(req.user.userId, body);
  }
}

// ═════════════════════════════ Administration de la plateforme ═════════════════════════════

@ApiTags('Administration plateforme')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSaasController {
  constructor(
    private readonly settings: SaasSettingsService,
    private readonly subscriptions: SubscriptionService,
    private readonly sectors: SectorsService,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // ── Tableau de bord ──
  @Get('overview')
  @ApiOperation({ summary: 'Indicateurs SaaS calculés sur les comptes et les paiements validés (?from=&to=)' })
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.subscriptions.overview({ from, to });
  }

  // ── Comptes ──
  @Get('accounts')
  accounts(@Query() q: any) {
    return this.subscriptions.accounts({ q: q.q, status: q.status, sector: q.sector, plan: q.plan, source: q.source, sort: q.sort, limit: Number(q.limit) || undefined, offset: Number(q.offset) || undefined });
  }

  @Get('accounts/:id')
  account(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.accountDetail(id);
  }

  @Post('accounts/:id/activate') @HttpCode(200)
  activate(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.activate(id, body || {}, actorId(req));
  }

  @Post('accounts/:id/suspend') @HttpCode(200)
  suspend(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.suspend(id, body?.reason, actorId(req));
  }

  @Post('accounts/:id/reactivate') @HttpCode(200)
  reactivate(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.reactivate(id, actorId(req));
  }

  @Post('accounts/:id/cancel') @HttpCode(200)
  cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.cancel(id, body?.reason, actorId(req));
  }

  @Post('accounts/:id/extend-trial') @HttpCode(200)
  extendTrial(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.extendTrial(id, Number(body?.hours), actorId(req));
  }

  @Patch('accounts/:id/subscription')
  updateSubscription(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.updateSubscription(id, body || {}, actorId(req));
  }

  // ── Formules ──
  @Get('plans') plans() { return this.subscriptions.plans('all'); }
  @Post('plans') createPlan(@Body() body: any) { return this.subscriptions.createPlan(body || {}); }
  @Patch('plans/:id') updatePlan(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.subscriptions.updatePlan(id, body || {}); }
  @Delete('plans/:id') deletePlan(@Param('id', ParseIntPipe) id: number) { return this.subscriptions.deletePlan(id); }

  // ── Réglages ──
  @Get('settings')
  async getSettings() {
    return { ...(await this.settings.get(true)), googleConfigured: !!this.settings.googleClientId(), paymentMethodOptions: PAYMENT_METHODS, moduleKeys: MODULE_KEYS };
  }

  @Put('settings')
  updateSettings(@Body() body: any) {
    return this.settings.update(body || {});
  }

  // ── Paiements ──
  @Get('payments')
  payments(@Query() q: any) {
    return this.subscriptions.adminPayments({ status: q.status, userId: Number(q.userId) || undefined, limit: Number(q.limit) || undefined, offset: Number(q.offset) || undefined });
  }

  @Post('payments')
  @ApiOperation({ summary: 'Saisit un paiement reçu hors ligne pour un compte ; validé tout de suite si validate = true' })
  async recordPayment(@Request() req: any, @Body() body: any) {
    const ownerId = Number(body?.userId);
    if (!Number.isInteger(ownerId)) throw new BadRequestException('Compte requis.');
    const payment = await this.subscriptions.declarePayment(ownerId, body, { role: 'admin', actorId: actorId(req) });
    return body?.validate === false ? payment : this.subscriptions.validatePayment(payment.id, actorId(req));
  }

  @Post('payments/:id/validate') @HttpCode(200)
  validatePayment(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.validatePayment(id, actorId(req));
  }

  @Post('payments/:id/reject') @HttpCode(200)
  rejectPayment(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.rejectPayment(id, body?.reason, actorId(req));
  }

  @Get('payments/:id/receipt')
  receipt(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.receipt(null, id);
  }

  // ── Messages des clients ──
  @Get('messages') messages(@Query('unread') unread?: string) { return this.subscriptions.adminMessages({ unread: unread === '1' || unread === 'true' }); }
  @Post('messages/:id/read') @HttpCode(200) readMessage(@Param('id', ParseIntPipe) id: number) { return this.subscriptions.markMessageRead(id); }

  // ── Secteurs, suggestions, prestations ──
  @Get('sectors') sectorsList() { return this.sectors.list('all'); }
  @Get('sectors/:code/detail') sectorDetail(@Param('code') code: string) { return this.sectors.detail(code, 'all'); }
  @Post('sectors') createSector(@Body() body: any) { return this.sectors.createSector(body || {}); }
  @Patch('sectors/:id') updateSector(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.sectors.updateSector(id, body || {}); }
  @Delete('sectors/:id') deleteSector(@Param('id', ParseIntPipe) id: number) { return this.sectors.deleteSector(id); }

  @Post('sectors/:id/apply-modules') @HttpCode(200)
  @ApiOperation({ summary: 'Applique les modules du secteur à tous les comptes de ce secteur' })
  applyModules(@Param('id', ParseIntPipe) id: number) { return this.sectors.applyModulesToAccounts(id); }

  @Post('sectors/:id/categories') createCategory(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.sectors.saveCategory(id, null, body || {}); }
  @Patch('sectors/:id/categories/:catId')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Param('catId', ParseIntPipe) catId: number, @Body() body: any) { return this.sectors.saveCategory(id, catId, body || {}); }
  @Delete('sectors/:id/categories/:catId')
  deleteCategory(@Param('id', ParseIntPipe) id: number, @Param('catId', ParseIntPipe) catId: number) { return this.sectors.deleteCategory(id, catId); }

  @Post('sectors/:id/items') createItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.sectors.saveItem(id, null, body || {}); }
  @Patch('sectors/:id/items/:itemId')
  updateItem(@Param('id', ParseIntPipe) id: number, @Param('itemId', ParseIntPipe) itemId: number, @Body() body: any) { return this.sectors.saveItem(id, itemId, body || {}); }
  @Delete('sectors/:id/items/:itemId')
  deleteItem(@Param('id', ParseIntPipe) id: number, @Param('itemId', ParseIntPipe) itemId: number) { return this.sectors.deleteItem(id, itemId); }

  @Get('service-offers') offers() { return this.sectors.offers('all'); }
  @Post('service-offers') createOffer(@Body() body: any) { return this.sectors.saveOffer(null, body || {}); }
  @Patch('service-offers/:id') updateOffer(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.sectors.saveOffer(id, body || {}); }
  @Delete('service-offers/:id') deleteOffer(@Param('id', ParseIntPipe) id: number) { return this.sectors.deleteOffer(id); }

  // ── Journal : ce que les administrateurs ont fait, et les changements d'état des comptes ──
  @Get('audit')
  @ApiOperation({ summary: 'Historique des actions des administrateurs et des événements de compte' })
  async auditLog(@Query() q: any) {
    const admins = await this.users.createQueryBuilder('u').select('u.id').where(`u.role IN ('admin','super_admin')`).getMany();
    const adminIds = admins.map((a) => a.id);
    const qb = this.audit.createQueryBuilder('a');
    qb.where('(a.entity IN (:...entities) OR a.actorId IN (:...adminIds))', { entities: ['account', 'subscription_payment', 'admin'], adminIds: adminIds.length ? adminIds : [0] });
    if (q.action) qb.andWhere('a.action = :action', { action: String(q.action) });
    if (q.userId) qb.andWhere('a.userId = :userId', { userId: Number(q.userId) });
    if (q.from) qb.andWhere('a.createdAt >= :from', { from: q.from });
    if (q.to) qb.andWhere('a.createdAt <= :to', { to: q.to });
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const [items, total] = await qb.orderBy('a.createdAt', 'DESC').addOrderBy('a.id', 'DESC').take(limit).skip(offset).getManyAndCount();
    return { total, limit, offset, items };
  }

  // ── Maintenance ──
  @Post('maintenance/sweep') @HttpCode(200)
  @ApiOperation({ summary: 'Lance tout de suite le balayage des expirations et des rappels' })
  sweep() { return this.subscriptions.sweep(); }
}
