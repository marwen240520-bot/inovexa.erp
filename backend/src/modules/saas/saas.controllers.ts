import {
  BadGatewayException, BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query, Request, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuditLog } from '../../common/audit/audit-log.entity';
import { AuditService } from '../../common/audit/audit.service';
import { MailService } from '../../common/mail/mail.service';
import { pickMailLang, testMail } from '../../common/mail/auth-mails';
import { AuthService } from '../auth/auth.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { AdminGuard } from './admin.guard';
import { SaasSettingsService } from './saas-settings.service';
import { SubscriptionService } from './subscription.service';
import { SectorsService } from './sectors.service';
import { MODULE_KEYS, effectiveModules } from './account-access';
import { PAYMENT_METHODS } from './saas-defaults';
import { apiPublicUrl, frontendUrl, returnBaseFor } from '../../common/origins';
import { securityChecks, securitySummary } from '../../common/security/security-report';
import { buildSecurityFacts } from '../../common/security/security-facts';

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
  @ApiOperation({ summary: 'Durée de l’essai, devise, contacts, identifiants Google et Apple (s’ils sont configurés)' })
  async config() {
    const s = await this.settings.get();
    const online = this.subscriptions.onlinePayment(s);
    // Le paiement se fait en ligne par carte (et carte e-Dinar) ; les moyens hors ligne ne s'ajoutent que si l'administrateur les a activés.
    const cardMethods = online.methods.filter((m) => m === 'card' || m === 'edinar');
    const offline = s.manualPayments ? (s.paymentMethods?.length ? s.paymentMethods : ['bank_transfer']) : [];
    return {
      trialHours: s.trialHours, currency: s.currency, vatRate: s.vatRate,
      // true = un code à 6 chiffres est envoyé par email à l'inscription, et demandé avant d'ouvrir l'ERP.
      requireEmailVerification: this.settings.verificationRequired(s),
      supportEmail: s.supportEmail, supportPhone: s.supportPhone, supportWhatsapp: s.supportWhatsapp,
      googleClientId: this.settings.googleClientId(), appleClientId: this.settings.appleClientId(), modules: MODULE_KEYS,
      paymentMethods: Array.from(new Set([...(cardMethods.length ? cardMethods : ['card']), ...offline])),
      onlinePayment: online.enabled,
    };
  }

  /**
   * Retour du prestataire de paiement (Konnect) : il appelle cette adresse en GET avec ?payment_ref=… quand un paiement
   * est traité — par son serveur, ou en y renvoyant le navigateur du client. La référence n'est jamais crue sur parole :
   * l'état du paiement est relu chez Konnect avec la clé du serveur, puis le client est ramené sur le site.
   */
  @Get('payments/konnect/return')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Notification / retour de paiement Konnect (?payment_ref=)' })
  async konnectReturn(@Query('payment_ref') ref: string, @Res() res: Response) {
    const providerRef = String(ref || '').slice(0, 80);
    const out = providerRef ? await this.subscriptions.confirmCheckout({ providerRef }).catch(() => null) : null;
    // L'adresse de retour a été enregistrée à l'ouverture du paiement, parmi les adresses autorisées du site.
    const base = out?.payment?.returnBase || frontendUrl();
    res.redirect(302, `${base}/subscription${out?.payment ? `?checkout=${out.payment.id}` : ''}`);
  }

  @Post('payments/konnect/return')
  @HttpCode(200)
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async konnectNotify(@Query('payment_ref') ref: string, @Body() body: any) {
    const providerRef = String(ref || body?.payment_ref || '').slice(0, 80);
    if (providerRef) await this.subscriptions.confirmCheckout({ providerRef }).catch(() => null);
    return { received: true };
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
    private readonly mail: MailService,
  ) {}

  /** Seul le propriétaire du compte engage la société (paiement, résiliation). */
  private assertOwner(req: any) {
    if (req.user.isTeamMember || req.user.role !== 'client') throw new ForbiddenException('Seul le propriétaire du compte gère l’abonnement.');
  }

  @Get('subscription')
  @ApiOperation({ summary: 'État du compte, temps d’essai restant (horloge du serveur), formule, paiement en ligne' })
  async subscription(@Request() req: any) {
    const s = await this.settings.get();
    // Un paiement par carte fait dans un autre onglet (ou juste avant de fermer la page) est reconnu ici.
    const opened = await this.subscriptions.openCheckout(req.user.userId);
    if (opened) await this.subscriptions.confirmCheckout({ id: opened.id, ownerId: req.user.userId }).catch(() => null);
    const owner = await this.subscriptions.owner(req.user.userId);
    const payments = await this.subscriptions.paymentsOf(owner.id);
    const teamCount = await this.users.count({ where: { ownerId: owner.id, isActive: true } });
    const plans = await this.subscriptions.plans('public');
    const online = this.subscriptions.onlinePayment(s);
    return {
      account: this.subscriptions.view(owner, s),
      company: { name: owner.companyName, email: owner.email },
      plan: plans.find((p) => p.code === owner.planCode) || null,
      users: { used: 1 + teamCount, limit: owner.userLimit ?? null },
      modules: effectiveModules(owner.modules, await this.subscriptions.allowedModules(owner.planCode)),
      pendingPayment: payments.find((p) => p.status === 'pending') || null,
      // Page de paiement par carte encore ouverte (à reprendre plutôt que d'en ouvrir une autre).
      checkout: await this.subscriptions.openCheckout(owner.id),
      payment: {
        currency: s.currency, vatRate: s.vatRate,
        // Paiement en ligne par carte : l'accès s'ouvre tout seul dès que le prestataire confirme l'encaissement.
        online: { enabled: online.enabled, provider: online.provider, test: online.mode === 'sandbox', methods: online.methods },
        onlinePayment: online.enabled,
        // Paiement hors ligne (virement, chèque…) : seulement si l'administrateur l'a activé ; il le valide alors lui-même.
        manual: s.manualPayments === true,
        instructions: s.manualPayments ? s.paymentInstructions : null,
        methods: s.manualPayments ? (s.paymentMethods?.length ? s.paymentMethods : ['bank_transfer']) : [],
        link: s.manualPayments ? s.paymentLink || null : null,
      },
      support: { email: s.supportEmail, phone: s.supportPhone, whatsapp: s.supportWhatsapp },
      canManage: !req.user.isTeamMember,
      // Sans serveur d'envoi, proposer « renvoyer le code » ne mènerait nulle part.
      emailEnabled: this.mail.isConfigured(),
    };
  }

  @Post('checkout')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Ouvre un paiement par carte pour une formule : renvoie l’adresse de la page de paiement' })
  checkout(@Request() req: any, @Body() body: any) {
    this.assertOwner(req);
    if (!body?.planCode) throw new BadRequestException('Formule requise.');
    return this.subscriptions.startCheckout(
      req.user.userId,
      { planCode: body.planCode, billingCycle: body.billingCycle },
      { actorId: actorId(req), returnBase: returnBaseFor(req.headers?.origin), apiBase: apiPublicUrl(req) },
    );
  }

  @Post('checkout/:id/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: 120, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Au retour de la page de paiement : relit l’état chez le prestataire et ouvre l’abonnement s’il est payé' })
  async verifyCheckout(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const out = await this.subscriptions.confirmCheckout({ id, ownerId: req.user.userId });
    const p = out.payment;
    return {
      status: out.status,
      payment: p ? { id: p.id, status: p.status, planName: p.planName, billingCycle: p.billingCycle, amountTTC: p.amountTTC, currency: p.currency, receiptNumber: p.receiptNumber, periodEnd: p.periodEnd } : null,
      account: this.subscriptions.view(await this.subscriptions.owner(req.user.userId), await this.settings.get()),
    };
  }

  // ── Secteur et modules : le client choisit lui-même ──

  @Get('modules')
  @ApiOperation({ summary: 'Secteur, modules ouverts, modules inclus dans la formule et modules conseillés pour le secteur' })
  modules(@Request() req: any) {
    return this.subscriptions.modulesView(req.user.userId);
  }

  @Put('modules')
  @ApiOperation({ summary: 'Le propriétaire ouvre ou ferme ses modules (dans la limite de sa formule)' })
  setModules(@Request() req: any, @Body() body: any) {
    this.assertOwner(req);
    return this.subscriptions.setModules(req.user.userId, body?.modules, actorId(req));
  }

  @Put('sector')
  @ApiOperation({ summary: 'Le propriétaire change de secteur d’activité (applyModules = true : reprend les modules conseillés)' })
  setSector(@Request() req: any, @Body() body: any) {
    this.assertOwner(req);
    return this.subscriptions.setSector(req.user.userId, body?.sector, body?.applyModules === true, actorId(req));
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
  @ApiOperation({ summary: 'Déclare un paiement hors ligne à faire valider par l’administrateur (403 si les paiements hors ligne ne sont pas activés)' })
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
    return { sectors: list.map((s) => ({ code: s.code, name: s.name, nameEn: s.nameEn, itemCount: s.itemCount })), current: code, ...(code ? await this.sectors.detail(code, 'public') : {}) };
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
    private readonly mail: MailService,
    private readonly auth: AuthService,
    private readonly audits: AuditService,
    private readonly gateway: PaymentGatewayService,
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

  @Post('accounts/:id/verify-email') @HttpCode(200)
  @ApiOperation({ summary: 'Confirme l’adresse email du compte à la place du client (vérification manuelle, journalisée)' })
  verifyEmail(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.auth.adminMarkEmailVerified(id, { id: actorId(req), email: req.user.email }, (req.ip || '').toString());
  }

  @Post('accounts/:id/reset-2fa') @HttpCode(200)
  @ApiOperation({ summary: 'Réinitialise la double authentification d’un client qui a perdu son téléphone (sessions fermées, client prévenu, journalisé)' })
  resetTwoFactor(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.auth.adminResetTwoFactor(id, { id: actorId(req), email: req.user.email }, (req.ip || '').toString());
  }

  @Post('accounts/:id/resend-verification') @HttpCode(200)
  @ApiOperation({ summary: 'Renvoie un code de vérification à l’adresse du compte (sans délai d’attente)' })
  resendVerification(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.auth.adminSendVerificationCode(id, { id: actorId(req), email: req.user.email }, body?.language, (req.ip || '').toString());
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
    const s = await this.settings.get(true);
    return {
      ...s, googleConfigured: !!this.settings.googleClientId(), appleConfigured: !!this.settings.appleClientId(),
      mailConfigured: this.mail.isConfigured(), paymentMethodOptions: PAYMENT_METHODS, moduleKeys: MODULE_KEYS,
      // Paiement en ligne (Konnect) : configuré par les variables d'environnement du serveur, jamais depuis cette page.
      onlinePayment: this.subscriptions.onlinePayment(s),
      // Le code de vérification n'est réellement demandé que si l'envoi d'emails fonctionne.
      emailVerificationActive: this.settings.verificationRequired(s),
    };
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
  @ApiOperation({ summary: 'Saisit un paiement reçu hors ligne pour un compte (cas exceptionnel) ; validé tout de suite sauf validate = false' })
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

  @Post('payments/:id/recheck') @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Relit tout de suite chez Konnect l’état d’un paiement en ligne et ouvre l’abonnement s’il est encaissé' })
  recheckPayment(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.subscriptions.recheckPayment(id, actorId(req));
  }

  @Post('payments/:id/refund') @HttpCode(200)
  @ApiOperation({ summary: 'Marque un paiement validé comme remboursé et retire la période qu’il avait ouverte (le virement se fait depuis le tableau de bord Konnect)' })
  refundPayment(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.subscriptions.refundPayment(id, body?.reason, actorId(req));
  }

  // ── Paiement en ligne : mise en production ──
  @Get('online-payment')
  @ApiOperation({ summary: 'Liste de contrôle « mise en production » du paiement par carte (Konnect), sans appeler Konnect' })
  async onlinePaymentStatus() {
    return this.subscriptions.onlineReadiness(await this.settings.get());
  }

  @Get('security')
  @ApiOperation({ summary: 'Contrôles de sécurité de la configuration du serveur (jamais de secret dans la réponse)' })
  async security() {
    const checks = securityChecks(await buildSecurityFacts({ mail: this.mail, gateway: this.gateway, users: this.users }));
    return { ...securitySummary(checks), production: process.env.NODE_ENV === 'production', checks };
  }

  @Post('online-payment/test') @HttpCode(200)
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @ApiOperation({ summary: 'Teste la connexion à Konnect : clé d’API acceptée ? (et, avec wallet = true, portefeuille reconnu ?)' })
  async onlinePaymentTest(@Request() req: any, @Body() body: any) {
    const result = await this.gateway.probe({ wallet: body?.wallet === true, webhookUrl: `${apiPublicUrl(req)}/public/payments/konnect/return` });
    await this.audits.record({ userId: actorId(req), actorId: actorId(req), actorEmail: req.user.email, action: 'konnect_test', entity: 'admin', ip: (req.ip || '').toString(), status: 200, details: { wallet: body?.wallet === true, keyAccepted: result.keyAccepted, walletAccepted: result.walletAccepted, mode: result.mode } });
    return result;
  }

  // ── Secteurs, suggestions, prestations ──
  @Get('sectors') sectorsList() { return this.sectors.list('all'); }
  @Get('sectors/:code/detail') sectorDetail(@Param('code') code: string) { return this.sectors.detail(code, 'all'); }
  @Post('sectors') createSector(@Body() body: any) { return this.sectors.createSector(body || {}); }
  @Patch('sectors/:id') updateSector(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.sectors.updateSector(id, body || {}); }
  @Delete('sectors/:id') deleteSector(@Param('id', ParseIntPipe) id: number) { return this.sectors.deleteSector(id); }

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
  @Get('maintenance/mail')
  @ApiOperation({ summary: 'État de l’envoi d’emails : configuration (sans secret) et réponse du serveur SMTP' })
  mailStatus() { return this.mail.check(); }

  @Post('maintenance/test-email') @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Envoie un email de test (à l’administrateur, ou à `to`) pour vérifier le serveur d’envoi' })
  async testEmail(@Request() req: any, @Body() body: any) {
    const me = await this.users.findOne({ where: { id: actorId(req) } });
    const to = String(body?.to || me?.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || to.length > 190) throw new BadRequestException('Adresse email invalide.');
    let ok = true;
    let failure = '';
    try {
      await this.mail.send({ to, ...testMail(pickMailLang(body?.language, me?.language)) });
    } catch (e: any) {
      ok = false;
      failure = String(e?.message || e).slice(0, 300);
    }
    await this.audits.record({ userId: actorId(req), actorId: actorId(req), actorEmail: req.user.email, action: ok ? 'mail_test_sent' : 'mail_test_failed', entity: 'admin', ip: (req.ip || '').toString(), status: ok ? 200 : 502, details: { to, error: failure || undefined } });
    if (!ok) throw new BadGatewayException(`L’email de test n’a pas pu partir : ${failure}`);
    return { success: true, to };
  }

  @Post('maintenance/sweep') @HttpCode(200)
  @ApiOperation({ summary: 'Lance tout de suite le balayage : expirations, rappels, relecture des paiements en ligne ouverts' })
  sweep() { return this.subscriptions.sweep(); }

  @Post('maintenance/upgrade-catalog') @HttpCode(200)
  @ApiOperation({ summary: 'Reporte les nouveautés du contenu de départ (secteurs, modules, formules en brouillon) sans toucher aux réglages modifiés' })
  upgradeCatalog() { return this.settings.upgradeDefaults(); }
}
