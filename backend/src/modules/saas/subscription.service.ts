import {
  BadGatewayException, BadRequestException, ConflictException, ForbiddenException, HttpException, Injectable, Logger, NotFoundException,
  OnApplicationBootstrap, OnModuleDestroy, ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { MailService } from '../../common/mail/mail.service';
import { pickMailLang } from '../../common/mail/auth-mails';
import { expiredMail, paymentRejectedMail, receiptMail, refundMail, renewalReminderMail, suspendedMail, trialReminderMail } from '../../common/mail/billing-mails';
import { SequenceService } from '../../common/sequences/sequence.service';
import { AuditService } from '../../common/audit/audit.service';
import { allowedOrigins, apiPublicUrl, frontendUrl } from '../../common/origins';
import { Plan, PlatformSettings, SubscriptionPayment } from './entities/saas.entity';
import { Sector } from './entities/sector.entity';
import { SaasSettingsService } from './saas-settings.service';
import { AccountAccess, CORE_MODULES, MODULE_KEYS, blockMessage, isModuleEnabled, modulesFromList, resolveAccess } from './account-access';
import { PAYMENT_METHODS } from './saas-defaults';
import { ONLINE_PROVIDER, PaymentGatewayService, toMinorUnits } from './payment-gateway.service';

/** Nombre écrit à la française pour les messages (3.1 → « 3,1 » ; avec digits : 106.981 → « 106,981 »). */
const frNumber = (n: number | null | undefined, digits?: number) =>
  n === null || n === undefined || !Number.isFinite(Number(n)) ? '—' : (digits === undefined ? String(Number(n)) : Number(n).toFixed(digits)).replace('.', ',');

const SWEEP_EVERY_MS = 10 * 60_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const frontend = () => frontendUrl();
/** Les reçus de la plateforme ont leur propre compteur (userId 0 : aucune société). */
const PLATFORM_SEQUENCE_OWNER = 0;
/** Durée de validité d'une page de paiement en ligne. */
const CHECKOUT_MINUTES = 30;
/** Pages de paiement qu'un compte peut ouvrir par heure (un clic malheureux ne doit pas bloquer, un robot si). */
const CHECKOUTS_PER_HOUR = 12;
/** États d'un paiement en ligne qui n'a pas (encore) abouti : ils ne figurent ni dans l'historique ni dans les compteurs. */
export const OPEN_ONLINE_STATUSES = ['initiated', 'expired'];
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Ajoute des mois calendaires (31 janvier + 1 mois = dernier jour de février). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}

const fmtDate = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat('fr-TN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Tunis' }).format(new Date(d)) : '—';

export interface AccountView {
  status: string; blocked: boolean; reason: string | null; message: string | null;
  trialStartedAt: Date | null; trialEndsAt: Date | null; subscriptionStart: Date | null; subscriptionEnd: Date | null;
  endsAt: Date | null; remainingSeconds: number | null; serverTime: string;
  planCode: string | null; billingCycle: string | null; sector: string | null; userLimit: number | null;
  emailVerified: boolean; expiryEnforced: boolean;
}

/** Cycle de vie des comptes : essai, abonnement, paiements, suspension — et les chiffres du tableau de bord administrateur. */
@Injectable()
export class SubscriptionService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('Subscription');
  private timer: NodeJS.Timeout | null = null;
  /** Compteurs de numérotation légale (sans état : le compteur est en base). */
  private readonly sequences = new SequenceService();

  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly settings: SaasSettingsService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly gateway: PaymentGatewayService,
  ) {}

  onApplicationBootstrap() {
    if (process.env.SAAS_SWEEP === 'false') return;
    this.timer = setInterval(() => void this.sweep().catch((e) => this.logger.warn(`Balayage des comptes : ${e?.message || e}`)), SWEEP_EVERY_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private users(em?: EntityManager) {
    return (em || this.ds.manager).getRepository(User);
  }

  /** Compte propriétaire (jamais un membre d'équipe ni un administrateur). */
  async owner(id: number, em?: EntityManager): Promise<User> {
    const user = await this.users(em).findOne({ where: { id, role: 'client', ownerId: IsNull() } });
    if (!user) throw new NotFoundException('Compte introuvable');
    return user;
  }

  // ───────────── État du compte ─────────────

  access(owner: User, settings: PlatformSettings, now = new Date()): AccountAccess {
    return resolveAccess(owner, now, { requireEmailVerification: this.settings.verificationRequired(settings) });
  }

  view(owner: User, settings: PlatformSettings, now = new Date()): AccountView {
    const a = this.access(owner, settings, now);
    return {
      status: a.status, blocked: a.blocked, reason: a.reason, message: a.blocked ? blockMessage(a.reason) : null,
      trialStartedAt: owner.trialStartedAt ?? null, trialEndsAt: owner.trialEndsAt ?? null,
      subscriptionStart: owner.subscriptionStart ?? null, subscriptionEnd: owner.subscriptionEnd ?? null,
      endsAt: a.endsAt, remainingSeconds: a.remainingSeconds, serverTime: now.toISOString(),
      planCode: owner.planCode ?? null, billingCycle: owner.billingCycle ?? null, sector: owner.sector ?? null,
      userLimit: owner.userLimit ?? null, emailVerified: !!owner.emailVerifiedAt || owner.signupSource !== 'self',
      expiryEnforced: owner.expiryEnforced !== false,
    };
  }

  /** Enregistre EXPIRED quand la période est finie (appelé à la volée par l'authentification, et par le balayage). */
  async persistExpired(owner: User, reason: 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED'): Promise<void> {
    const res = await this.users().update(
      { id: owner.id, accountStatus: owner.accountStatus },
      { accountStatus: 'EXPIRED', statusReason: reason, statusChangedAt: new Date() },
    );
    if (!res.affected) return; // déjà fait par une autre requête
    void this.audit.record({ userId: owner.id, actorId: null, action: 'account_expired', entity: 'account', entityId: owner.id, details: { reason } });
    void this.mail.trySend({ to: owner.email, ...expiredMail({ lang: pickMailLang(owner.language), name: owner.name, reason, url: `${frontend()}/subscription` }) });
  }

  /** Démarre l'essai gratuit d'un compte qui vient d'être créé. La durée vient des réglages de la plateforme. */
  async trialDates(now = new Date()): Promise<{ trialStartedAt: Date; trialEndsAt: Date; trialHours: number }> {
    const { trialHours } = await this.settings.get();
    return { trialStartedAt: now, trialEndsAt: new Date(now.getTime() + trialHours * HOUR), trialHours };
  }

  /** Modules PAR DÉFAUT d'un secteur (tous les modules si le secteur est inconnu). Une aide au démarrage, pas un droit. */
  async sectorModules(code: string | null | undefined, em?: EntityManager): Promise<Record<string, boolean>> {
    const sector = code ? await (em || this.ds.manager).getRepository(Sector).findOne({ where: { code } }) : null;
    const list = sector?.modules?.length ? sector.modules : MODULE_KEYS;
    return modulesFromList(list);
  }

  // ───────────── Actions de l'administrateur ─────────────

  private async log(adminId: number | null, ownerId: number, action: string, details?: any) {
    await this.audit.record({ userId: ownerId, actorId: adminId, action, entity: 'account', entityId: ownerId, details });
  }

  private async applyPlan(owner: User, planCode: string, billingCycle: string | null | undefined, em: EntityManager) {
    const plan = await em.getRepository(Plan).findOne({ where: { code: planCode } });
    if (!plan) throw new BadRequestException('Formule inconnue.');
    const changed = owner.planCode !== plan.code;
    owner.planCode = plan.code;
    owner.userLimit = plan.maxUsers ?? null;
    if (billingCycle) owner.billingCycle = billingCycle === 'annual' ? 'annual' : 'monthly';
    // Changement de formule : le client garde les modules qu'il avait choisis et retrouve ceux de son secteur, dans la
    // limite de ce que la nouvelle formule inclut. Il les ajuste ensuite lui-même (Abonnement › Mes modules).
    if (changed) {
      const sectorMods = await this.sectorModules(owner.sector, em);
      const allowed = plan.modules?.length ? new Set(plan.modules) : null;
      const configured = !!owner.modules && Object.keys(owner.modules).length > 0;
      owner.modules = modulesFromList(MODULE_KEYS.filter((k) => (sectorMods[k] || (configured && owner.modules[k] === true)) && (!allowed || allowed.has(k))));
    }
    return plan;
  }

  /** Active le compte (après paiement hors ligne, geste commercial…) jusqu'à une date ou pour un nombre de mois. */
  async activate(ownerId: number, dto: { planCode?: string; billingCycle?: string; months?: number; until?: string | Date | null; noExpiry?: boolean }, adminId: number) {
    return this.ds.transaction(async (em) => {
      const owner = await this.owner(ownerId, em);
      const now = new Date();
      if (dto.planCode) await this.applyPlan(owner, dto.planCode, dto.billingCycle, em);
      if (dto.until) {
        const until = new Date(dto.until);
        if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime()) throw new BadRequestException('La date de fin doit être dans le futur.');
        owner.subscriptionEnd = until;
        owner.expiryEnforced = true;
      } else if (dto.months !== undefined && dto.months !== null) {
        const months = Number(dto.months);
        if (!Number.isInteger(months) || months < 1 || months > 60) throw new BadRequestException('Durée invalide (1 à 60 mois).');
        const currentEnd = owner.subscriptionEnd ? new Date(owner.subscriptionEnd) : null;
        const base = owner.accountStatus === 'ACTIVE' && currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
        owner.subscriptionEnd = addMonths(base, months);
        owner.expiryEnforced = true;
      } else if (dto.noExpiry) {
        owner.subscriptionEnd = null as any;
        owner.expiryEnforced = false;
      } else if (owner.expiryEnforced !== false && (!owner.subscriptionEnd || new Date(owner.subscriptionEnd).getTime() <= now.getTime())) {
        throw new BadRequestException('Indiquez une durée (mois) ou une date de fin pour activer ce compte.');
      }
      if (!owner.subscriptionStart || owner.accountStatus !== 'ACTIVE') owner.subscriptionStart = now;
      owner.accountStatus = 'ACTIVE';
      owner.isActive = true;
      owner.statusReason = null;
      owner.statusChangedAt = now;
      owner.renewalReminderStage = 0;
      await em.save(User, owner);
      await this.log(adminId, owner.id, 'account_activated', { planCode: owner.planCode, subscriptionEnd: owner.subscriptionEnd });
      return this.view(owner, await this.settings.get());
    });
  }

  async suspend(ownerId: number, reason: string | undefined, adminId: number) {
    const owner = await this.owner(ownerId);
    owner.accountStatus = 'SUSPENDED';
    owner.statusReason = (reason || '').trim().slice(0, 200) || null;
    owner.statusChangedAt = new Date();
    await this.users().save(owner);
    await this.log(adminId, owner.id, 'account_suspended', { reason: owner.statusReason });
    void this.mail.trySend({ to: owner.email, ...suspendedMail({ lang: pickMailLang(owner.language), name: owner.name, reason: owner.statusReason, url: `${frontend()}/subscription` }) });
    return this.view(owner, await this.settings.get());
  }

  /** Lève une suspension ou une résiliation : le compte retrouve l'état que ses dates justifient. */
  async reactivate(ownerId: number, adminId: number) {
    const owner = await this.owner(ownerId);
    const now = Date.now();
    const subEnd = owner.subscriptionEnd ? new Date(owner.subscriptionEnd).getTime() : null;
    const trialEnd = owner.trialEndsAt ? new Date(owner.trialEndsAt).getTime() : null;
    const paid = !!owner.subscriptionStart;
    if (paid && (owner.expiryEnforced === false || subEnd === null || subEnd > now)) owner.accountStatus = 'ACTIVE';
    else if (!paid && trialEnd !== null && trialEnd > now) owner.accountStatus = 'TRIAL';
    else if (!paid && owner.signupSource === 'admin' && trialEnd === null) owner.accountStatus = 'ACTIVE';
    else {
      owner.accountStatus = 'EXPIRED';
      owner.statusReason = paid ? 'SUBSCRIPTION_EXPIRED' : 'TRIAL_EXPIRED';
    }
    if (owner.accountStatus !== 'EXPIRED') owner.statusReason = null;
    owner.isActive = true;
    owner.statusChangedAt = new Date();
    await this.users().save(owner);
    await this.log(adminId, owner.id, 'account_reactivated', { status: owner.accountStatus });
    return this.view(owner, await this.settings.get());
  }

  async cancel(ownerId: number, reason: string | undefined, actorId: number) {
    const owner = await this.owner(ownerId);
    owner.accountStatus = 'CANCELLED';
    owner.statusReason = (reason || '').trim().slice(0, 200) || null;
    owner.statusChangedAt = new Date();
    await this.users().save(owner);
    await this.log(actorId, owner.id, 'account_cancelled', { reason: owner.statusReason });
    return this.view(owner, await this.settings.get());
  }

  /** Prolonge (ou rouvre) l'essai gratuit. */
  async extendTrial(ownerId: number, hours: number, adminId: number) {
    const h = Number(hours);
    if (!Number.isInteger(h) || h < 1 || h > 24 * 90) throw new BadRequestException('Durée invalide (1 à 2 160 heures).');
    const owner = await this.owner(ownerId);
    const now = new Date();
    const current = owner.trialEndsAt ? new Date(owner.trialEndsAt) : null;
    const base = owner.accountStatus === 'TRIAL' && current && current.getTime() > now.getTime() ? current : now;
    owner.trialStartedAt = owner.trialStartedAt || now;
    owner.trialEndsAt = new Date(base.getTime() + h * HOUR);
    owner.accountStatus = 'TRIAL';
    owner.statusReason = null;
    owner.statusChangedAt = now;
    owner.trialReminderStage = 0;
    owner.isActive = true;
    await this.users().save(owner);
    await this.log(adminId, owner.id, 'trial_extended', { hours: h, trialEndsAt: owner.trialEndsAt });
    return this.view(owner, await this.settings.get());
  }

  /** Corrige à la main la formule, l'échéance, le secteur ou la limite d'utilisateurs d'un compte. */
  async updateSubscription(ownerId: number, dto: Record<string, any>, adminId: number) {
    return this.ds.transaction(async (em) => {
      const owner = await this.owner(ownerId, em);
      if (dto.sector !== undefined) {
        if (dto.sector && !(await em.getRepository(Sector).findOne({ where: { code: String(dto.sector) } }))) throw new BadRequestException('Secteur inconnu.');
        owner.sector = dto.sector ? String(dto.sector) : null;
        if (dto.applySectorModules) owner.modules = await this.sectorModules(owner.sector, em);
      }
      if (dto.planCode) await this.applyPlan(owner, String(dto.planCode), dto.billingCycle, em);
      else if (dto.planCode === null) { owner.planCode = null; owner.billingCycle = null; }
      else if (dto.billingCycle) owner.billingCycle = dto.billingCycle === 'annual' ? 'annual' : 'monthly';
      if (dto.userLimit !== undefined) {
        const n = dto.userLimit === null || dto.userLimit === '' ? null : Number(dto.userLimit);
        if (n !== null && (!Number.isInteger(n) || n < 1 || n > 10_000)) throw new BadRequestException('Limite d’utilisateurs invalide.');
        owner.userLimit = n;
      }
      if (dto.subscriptionEnd !== undefined) {
        if (dto.subscriptionEnd === null || dto.subscriptionEnd === '') owner.subscriptionEnd = null as any;
        else {
          const d = new Date(dto.subscriptionEnd);
          if (Number.isNaN(d.getTime())) throw new BadRequestException('Date de fin invalide.');
          owner.subscriptionEnd = d;
          owner.expiryEnforced = true;
          owner.renewalReminderStage = 0;
        }
      }
      if (dto.expiryEnforced !== undefined) owner.expiryEnforced = dto.expiryEnforced === true;
      await em.save(User, owner);
      await this.log(adminId, owner.id, 'subscription_updated', dto);
      return this.view(owner, await this.settings.get());
    });
  }

  // ───────────── Secteur et modules : choisis par le client lui-même ─────────────

  /**
   * Modules DISPONIBLES : ce que la formule met à disposition (null = tous). Sans formule — pendant l'essai — tout est
   * disponible. Lu à chaque requête (garde du serveur, session) : une modification de la formule s'applique aussitôt.
   */
  async allowedModules(planCode: string | null | undefined, em?: EntityManager): Promise<Set<string> | null> {
    if (!planCode) return null;
    const plan = await (em || this.ds.manager).getRepository(Plan).findOne({ where: { code: planCode }, select: ['id', 'code', 'modules'] });
    return plan?.modules?.length ? new Set(plan.modules) : null;
  }

  private planModules(owner: User, em?: EntityManager): Promise<Set<string> | null> {
    return this.allowedModules(owner.planCode, em);
  }

  /**
   * Ce que la page « Mes modules » affiche, avec les trois notions séparées :
   *  - included    = DISPONIBLE : la formule le met à disposition ;
   *  - recommended = PAR DÉFAUT : le secteur l'ouvre au départ ;
   *  - activated   = ACTIVÉ : le client l'a ouvert (son choix, même si la formule ne le comprend plus) ;
   *  - enabled     = réellement utilisable = activé ET disponible (c'est ce que le serveur applique).
   */
  async modulesView(ownerId: number) {
    const owner = await this.owner(ownerId);
    const allowed = await this.planModules(owner);
    const sectorMods = await this.sectorModules(owner.sector);
    const sectors = await this.ds.getRepository(Sector).find({ where: { isActive: true }, order: { sortOrder: 'ASC', id: 'ASC' } });
    const plan = owner.planCode ? await this.ds.getRepository(Plan).findOne({ where: { code: owner.planCode } }) : null;
    return {
      sector: owner.sector ?? null,
      plan: plan ? { code: plan.code, name: plan.name, allModules: !plan.modules?.length } : null,
      // Pendant l'essai, aucune formule ne limite les modules : le client essaie ce qu'il veut.
      trial: owner.accountStatus === 'TRIAL',
      modules: MODULE_KEYS.filter((k) => !CORE_MODULES.includes(k)).map((key) => ({
        key,
        enabled: isModuleEnabled(owner.modules, key) && (!allowed || allowed.has(key)),
        activated: isModuleEnabled(owner.modules, key),
        included: !allowed || allowed.has(key),
        recommended: sectorMods[key] === true,
      })),
      sectors: sectors.map((s) => ({ code: s.code, name: s.name, nameEn: s.nameEn, modules: s.modules || [] })),
    };
  }

  /** Le propriétaire ouvre ou ferme lui-même ses modules, dans la limite de ce que sa formule inclut. */
  async setModules(ownerId: number, list: unknown, actorId: number) {
    if (!Array.isArray(list)) throw new BadRequestException('Liste de modules attendue.');
    const wanted = Array.from(new Set(list.map(String)));
    const unknown = wanted.filter((m) => !(MODULE_KEYS as readonly string[]).includes(m));
    if (unknown.length) throw new BadRequestException(`Module inconnu : ${unknown.join(', ')}.`);
    const owner = await this.owner(ownerId);
    const allowed = await this.planModules(owner);
    const refused = wanted.filter((m) => !CORE_MODULES.includes(m) && allowed && !allowed.has(m));
    if (refused.length) {
      throw new ForbiddenException({ statusCode: 403, error: 'Forbidden', code: 'MODULE_NOT_IN_PLAN', modules: refused, message: `Votre formule n’inclut pas ce module (${refused.join(', ')}). Passez à une formule supérieure pour l’ouvrir.` });
    }
    owner.modules = modulesFromList(wanted);
    await this.users().save(owner);
    await this.audit.record({ userId: owner.id, actorId, action: 'modules_changed', entity: 'account', entityId: owner.id, details: { modules: wanted.filter((m) => !CORE_MODULES.includes(m)) } });
    return this.modulesView(owner.id);
  }

  /** Le propriétaire change lui-même de secteur ; avec applyModules, il reçoit les modules conseillés pour ce secteur. */
  async setSector(ownerId: number, code: unknown, applyModules: boolean, actorId: number) {
    const sector = await this.ds.getRepository(Sector).findOne({ where: { code: String(code || '').toLowerCase(), isActive: true } });
    if (!sector) throw new BadRequestException('Choisissez votre secteur d’activité dans la liste.');
    const owner = await this.owner(ownerId);
    owner.sector = sector.code;
    if (applyModules) {
      const allowed = await this.planModules(owner);
      const sectorMods = await this.sectorModules(sector.code);
      owner.modules = modulesFromList(MODULE_KEYS.filter((k) => sectorMods[k] && (!allowed || allowed.has(k))));
    }
    await this.users().save(owner);
    await this.audit.record({ userId: owner.id, actorId, action: 'sector_changed', entity: 'account', entityId: owner.id, details: { sector: sector.code, applyModules } });
    return this.modulesView(owner.id);
  }

  // ───────────── Formules ─────────────

  async plans(scope: 'public' | 'all') {
    const where = scope === 'public' ? { isPublic: true, isActive: true } : {};
    return this.ds.getRepository(Plan).find({ where, order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  private cleanPlan(dto: Record<string, any>, partial: boolean): Partial<Plan> {
    const out: Partial<Plan> = {};
    const price = (key: 'priceMonthly' | 'priceAnnual') => {
      if (dto[key] === undefined) return;
      if (dto[key] === null || dto[key] === '') { out[key] = null; return; }
      const v = Number(dto[key]);
      if (!Number.isFinite(v) || v < 0 || v > 1_000_000) throw new BadRequestException(`Prix invalide (${key}).`);
      out[key] = round3(v);
    };
    if (!partial || dto.code !== undefined) {
      const code = String(dto.code || '').trim().toLowerCase();
      if (!/^[a-z0-9][a-z0-9_-]{1,38}$/.test(code)) throw new BadRequestException('Code invalide : lettres minuscules, chiffres, tirets (2 à 39 caractères).');
      out.code = code;
    }
    if (!partial || dto.name !== undefined) {
      const name = String(dto.name || '').trim();
      if (name.length < 2 || name.length > 80) throw new BadRequestException('Nom de formule invalide (2 à 80 caractères).');
      out.name = name;
    }
    if (dto.description !== undefined) out.description = dto.description ? String(dto.description).slice(0, 400) : null;
    price('priceMonthly');
    price('priceAnnual');
    if (dto.maxUsers !== undefined) {
      const n = dto.maxUsers === null || dto.maxUsers === '' ? null : Number(dto.maxUsers);
      if (n !== null && (!Number.isInteger(n) || n < 1 || n > 10_000)) throw new BadRequestException('Nombre d’utilisateurs invalide.');
      out.maxUsers = n;
    }
    if (dto.modules !== undefined) {
      if (dto.modules === null) out.modules = null;
      else {
        if (!Array.isArray(dto.modules)) throw new BadRequestException('Modules invalides.');
        const bad = dto.modules.filter((m: any) => !(MODULE_KEYS as readonly string[]).includes(String(m)));
        if (bad.length) throw new BadRequestException(`Module inconnu : ${bad.join(', ')}.`);
        out.modules = dto.modules.length ? Array.from(new Set(dto.modules.map(String))) : null;
      }
    }
    if (dto.features !== undefined) out.features = Array.isArray(dto.features) ? dto.features.map((f: any) => String(f).trim().slice(0, 160)).filter(Boolean).slice(0, 20) : null;
    for (const key of ['isPublic', 'isActive', 'highlight'] as const) if (dto[key] !== undefined) out[key] = dto[key] === true;
    if (dto.sortOrder !== undefined) out.sortOrder = Math.trunc(Number(dto.sortOrder)) || 0;
    return out;
  }

  async createPlan(dto: Record<string, any>) {
    const data = this.cleanPlan(dto, false);
    const repo = this.ds.getRepository(Plan);
    if (await repo.findOne({ where: { code: data.code } })) throw new ConflictException('Ce code de formule existe déjà.');
    return repo.save(repo.create(data));
  }

  async updatePlan(id: number, dto: Record<string, any>) {
    const repo = this.ds.getRepository(Plan);
    const plan = await repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Formule introuvable');
    const data = this.cleanPlan(dto, true);
    if (data.code && data.code !== plan.code) {
      if (await repo.findOne({ where: { code: data.code } })) throw new ConflictException('Ce code de formule existe déjà.');
      if (await this.users().count({ where: { planCode: plan.code } })) throw new ConflictException('Des comptes utilisent cette formule : son code ne peut plus changer.');
    }
    const next = { ...plan, ...data };
    if (next.isPublic && next.priceMonthly === null && next.priceAnnual === null && data.isPublic) {
      // Une formule publiée sans prix s'affiche « sur devis » : autorisé, mais elle ne peut pas être souscrite en ligne.
    }
    return repo.save(next);
  }

  async deletePlan(id: number) {
    const repo = this.ds.getRepository(Plan);
    const plan = await repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Formule introuvable');
    const used = (await this.users().count({ where: { planCode: plan.code } })) + (await this.ds.getRepository(SubscriptionPayment).count({ where: { planCode: plan.code } }));
    if (used) throw new ConflictException('Cette formule est utilisée par des comptes ou des paiements : désactivez-la au lieu de la supprimer.');
    await repo.delete({ id });
    return { success: true };
  }

  // ───────────── Paiements ─────────────

  /** Déclare un paiement (virement, espèces, chèque…). Le montant vient de la formule, jamais du navigateur. */
  async declarePayment(
    ownerId: number,
    dto: { planCode: string; billingCycle: string; method: string; reference?: string; note?: string },
    by: { role: 'client' | 'admin'; actorId: number },
  ) {
    const settings = await this.settings.get();
    // Par défaut tout se paie en ligne (Flouci) : la déclaration hors ligne n'existe pour le client que si
    // l'administrateur l'a activée (Réglages › Paiements hors ligne).
    if (by.role === 'client' && !settings.manualPayments) {
      throw new ForbiddenException({ statusCode: 403, error: 'Forbidden', code: 'MANUAL_PAYMENTS_DISABLED', message: 'Le paiement se fait en ligne, par carte bancaire ou avec l’application Flouci.' });
    }
    const owner = await this.owner(ownerId);
    const plan = await this.ds.getRepository(Plan).findOne({ where: { code: String(dto.planCode || '') } });
    if (!plan || !plan.isActive || (by.role === 'client' && !plan.isPublic)) throw new BadRequestException('Formule indisponible.');
    const cycle = dto.billingCycle === 'annual' ? 'annual' : 'monthly';
    const amountHT = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    if (amountHT === null || amountHT === undefined) throw new BadRequestException('Cette formule est sur devis : elle ne peut pas être souscrite en ligne.');
    const allowed = by.role === 'admin' ? (PAYMENT_METHODS as readonly string[]) : settings.paymentMethods?.length ? settings.paymentMethods : ['bank_transfer'];
    if (!allowed.includes(dto.method)) throw new BadRequestException('Moyen de paiement indisponible.');

    const repo = this.ds.getRepository(SubscriptionPayment);
    if (by.role === 'client' && (await repo.count({ where: { userId: owner.id, status: 'pending' } }))) {
      throw new ConflictException('Un paiement est déjà en attente de validation. Vous serez prévenu dès qu’il sera traité.');
    }
    const vatRate = Number(settings.vatRate) || 0;
    const payment = await repo.save(repo.create({
      userId: owner.id, planCode: plan.code, planName: plan.name, billingCycle: cycle, periodMonths: cycle === 'annual' ? 12 : 1,
      amountHT: round3(amountHT), vatRate, amountTTC: round3(amountHT * (1 + vatRate / 100)), currency: settings.currency || 'USD',
      method: dto.method, provider: 'manual', reference: (dto.reference || '').trim().slice(0, 120) || null,
      note: (dto.note || '').trim().slice(0, 500) || null, status: 'pending', declaredBy: by.role,
    }));
    await this.audit.record({ userId: owner.id, actorId: by.actorId, action: 'payment_declared', entity: 'subscription_payment', entityId: payment.id, details: { planCode: plan.code, cycle, amountTTC: payment.amountTTC, method: dto.method } });
    if (by.role === 'client' && settings.supportEmail) {
      void this.mail.trySend({
        to: settings.supportEmail, replyTo: owner.email,
        subject: `Paiement à valider — ${owner.companyName || owner.name}`,
        text: `${owner.companyName || owner.name} (${owner.email}) déclare un paiement de ${payment.amountTTC} ${payment.currency} TTC pour la formule ${plan.name} (${cycle === 'annual' ? 'annuel' : 'mensuel'}).\nMoyen : ${dto.method}\nRéférence : ${payment.reference || '—'}\n\nÀ valider : ${frontend()}/admin/payments`,
      });
    }
    return payment;
  }

  /**
   * Cœur commun à la validation par l'administrateur et à l'encaissement en ligne : ouvre (ou prolonge) la période
   * d'abonnement, applique la formule, rend l'accès et attribue le numéro de reçu. À appeler dans une transaction,
   * la ligne du paiement étant verrouillée.
   */
  private async applyValidated(em: EntityManager, payment: SubscriptionPayment, validatedBy: number | null, now: Date) {
    const owner = await this.owner(payment.userId, em);
    const currentEnd = owner.subscriptionEnd ? new Date(owner.subscriptionEnd) : null;
    const suspended = owner.accountStatus === 'SUSPENDED';
    // Renouvellement avant l'échéance : la nouvelle période s'ajoute à la suite, aucun jour payé n'est perdu.
    // Paiement pendant l'essai gratuit : la période payée commence à la fin de l'essai, aucun jour gratuit n'est perdu.
    const trialEnd = owner.trialEndsAt ? new Date(owner.trialEndsAt) : null;
    const start =
      (owner.accountStatus === 'ACTIVE' || (suspended && !!owner.subscriptionStart)) && owner.expiryEnforced !== false && currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd
      : owner.accountStatus === 'TRIAL' && trialEnd && trialEnd.getTime() > now.getTime() ? trialEnd
      : now;
    const end = addMonths(start, payment.periodMonths);

    await this.applyPlan(owner, payment.planCode, payment.billingCycle, em);
    if (!owner.subscriptionStart || owner.accountStatus !== 'ACTIVE') owner.subscriptionStart = now;
    owner.subscriptionEnd = end;
    owner.expiryEnforced = true;
    // Une suspension décidée par l'administrateur n'est pas levée par un paiement en ligne : la période payée est
    // enregistrée, et l'accès revient dès que l'administrateur réactive le compte.
    if (!(suspended && validatedBy === null)) {
      owner.accountStatus = 'ACTIVE';
      owner.isActive = true;
      owner.statusReason = null;
      owner.statusChangedAt = now;
    }
    owner.renewalReminderStage = 0;
    await em.save(User, owner);

    payment.status = 'validated';
    payment.validatedAt = now;
    payment.validatedBy = validatedBy;
    payment.periodStart = start;
    payment.periodEnd = end;
    payment.checkoutUrl = null;
    // Numéro de reçu attribué dans la MÊME transaction que la validation : la suite est continue, sans trou (un paiement
    // abandonné ou refusé ne consomme aucun numéro).
    const year = now.getUTCFullYear();
    payment.receiptNumber = this.sequences.format('REC', year, await this.sequences.next(em, PLATFORM_SEQUENCE_OWNER, 'platform_receipt', year));
    await em.getRepository(SubscriptionPayment).save(payment);
    return { payment, owner };
  }

  private receiptMail(owner: User, payment: SubscriptionPayment, online: boolean) {
    void this.mail.trySend({
      to: owner.email,
      ...receiptMail({
        lang: pickMailLang(owner.language), name: owner.name, online, amount: payment.amountTTC, currency: payment.currency, planName: payment.planName,
        periodEnd: payment.periodEnd, receiptNumber: String(payment.receiptNumber || ''), url: `${frontend()}/dashboard/billing`,
        charged: online && payment.chargedAmount != null && payment.chargedCurrency ? { amount: payment.chargedAmount, currency: payment.chargedCurrency } : null,
      }),
    });
  }

  /** L'administrateur valide un paiement hors ligne : ouvre (ou prolonge) la période d'abonnement et rend l'accès. */
  async validatePayment(paymentId: number, adminId: number) {
    const result = await this.ds.transaction(async (em) => {
      const repo = em.getRepository(SubscriptionPayment);
      const payment = await repo.findOne({ where: { id: paymentId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw new NotFoundException('Paiement introuvable');
      if (payment.status !== 'pending') throw new ConflictException('Ce paiement a déjà été traité.');
      return this.applyValidated(em, payment, adminId, new Date());
    });
    const { payment, owner } = result;
    await this.audit.record({ userId: owner.id, actorId: adminId, action: 'payment_validated', entity: 'subscription_payment', entityId: payment.id, details: { receipt: payment.receiptNumber, periodEnd: payment.periodEnd } });
    this.receiptMail(owner, payment, false);
    return payment;
  }

  // ───────────── Paiement en ligne (Flouci : carte bancaire ou application) : aucune intervention de l'administrateur ─────────────

  /** Ce que la page Abonnement (et l'administration) doivent savoir du paiement en ligne. */
  onlinePayment(settings: PlatformSettings) {
    const g = this.gateway.info();
    const rate = this.gateway.rate(settings.currency);
    const currencyOk = rate !== null;
    return {
      enabled: g.configured && currencyOk,
      provider: g.provider,
      mode: g.mode,
      methods: g.methods,
      // Flouci débite en dinars : taux appliqué au montant des formules (1 si elles sont déjà en dinars ; null = non encaissable).
      charge: currencyOk ? { currency: g.chargeCurrency, rate: rate as number } : null,
      // Pourquoi le bouton « Payer » n'est pas disponible (affiché à l'administrateur, pas au client).
      reason: !g.configured ? 'NOT_CONFIGURED' : !currencyOk ? 'CURRENCY_UNSUPPORTED' : null,
    };
  }

  /** Page de paiement encore ouverte pour ce compte (pour la reprendre au lieu d'en créer une autre). */
  async openCheckout(ownerId: number, now = new Date()) {
    const row = await this.ds.getRepository(SubscriptionPayment).findOne({ where: { userId: ownerId, status: 'initiated', provider: ONLINE_PROVIDER }, order: { id: 'DESC' } });
    if (!row || !row.checkoutUrl || !row.expiresAt || new Date(row.expiresAt).getTime() <= now.getTime()) return null;
    return {
      id: row.id, payUrl: row.checkoutUrl, expiresAt: row.expiresAt, planCode: row.planCode, billingCycle: row.billingCycle, amountTTC: row.amountTTC, currency: row.currency,
      chargedAmount: row.chargedAmount ?? null, chargedCurrency: row.chargedCurrency ?? null,
    };
  }

  /**
   * Le client choisit sa formule et clique « Payer » : le montant est calculé ICI (formule, TVA, devise des réglages, puis
   * conversion en dinars au taux du serveur si besoin), le paiement est ouvert chez Flouci, et le navigateur reçoit
   * l'adresse de la page de paiement.
   */
  async startCheckout(
    ownerId: number,
    dto: { planCode?: string; billingCycle?: string },
    ctx: { actorId: number; returnBase: string; apiBase: string },
  ) {
    const settings = await this.settings.get();
    const owner = await this.owner(ownerId);
    if (owner.accountStatus === 'SUSPENDED' || owner.isActive === false) throw new ForbiddenException('Votre compte est suspendu : contactez le support.');
    const plan = await this.ds.getRepository(Plan).findOne({ where: { code: String(dto.planCode || '') } });
    if (!plan || !plan.isActive || !plan.isPublic) throw new BadRequestException('Formule indisponible.');
    const cycle = dto.billingCycle === 'annual' ? 'annual' : 'monthly';
    const amountHT = cycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
    if (amountHT === null || amountHT === undefined) throw new BadRequestException('Cette formule est sur devis : elle ne peut pas être souscrite en ligne.');
    const online = this.onlinePayment(settings);
    if (!online.enabled) {
      throw new ServiceUnavailableException({ statusCode: 503, error: 'Service Unavailable', code: 'ONLINE_PAYMENT_UNAVAILABLE', message: 'Le paiement en ligne est en cours d’activation. Réessayez un peu plus tard.' });
    }
    const currency = settings.currency;
    const vatRate = Number(settings.vatRate) || 0;
    const ht = round3(amountHT);
    // Le prestataire encaisse au centime (au millime pour le dinar) : le montant TTC est arrondi à cette unité.
    const digits = currency === 'TND' ? 3 : 2;
    const ttc = Math.round(ht * (1 + vatRate / 100) * 10 ** digits) / 10 ** digits;
    if (!(ttc > 0)) throw new BadRequestException('Cette formule est gratuite : il n’y a rien à payer.');
    // Montant réellement débité par Flouci, en dinars (converti si les formules sont dans une autre devise).
    const charge = this.gateway.quote(ttc, currency);
    if (!(charge.minor > 0)) throw new BadRequestException('Montant trop faible pour un paiement en ligne.');

    const repo = this.ds.getRepository(SubscriptionPayment);
    const now = new Date();
    const recent = await repo.createQueryBuilder('p').where(`p.userId = :ownerId AND p.provider = :provider AND p.createdAt > :since`, { ownerId: owner.id, provider: ONLINE_PROVIDER, since: new Date(now.getTime() - HOUR) }).getCount();
    if (recent >= CHECKOUTS_PER_HOUR) throw new HttpException('Trop de tentatives de paiement. Réessayez dans une heure.', 429);

    // Une seule page de paiement ouverte à la fois : on reprend celle qui correspond, les autres sont refermées.
    // (Si le client paie quand même une page refermée, l'encaissement est reconnu : voir confirmCheckout.)
    const opened = await repo.find({ where: { userId: owner.id, status: 'initiated', provider: ONLINE_PROVIDER } });
    for (const row of opened) {
      const usable = row.checkoutUrl && row.expiresAt && new Date(row.expiresAt).getTime() > now.getTime() + 2 * 60_000;
      const sameCharge = row.chargedAmount === charge.amount && row.chargedCurrency === charge.currency;
      if (usable && sameCharge && row.planCode === plan.code && row.billingCycle === cycle && row.amountTTC === ttc && row.currency === currency && row.returnBase === ctx.returnBase) {
        return { id: row.id, payUrl: row.checkoutUrl!, expiresAt: row.expiresAt, amountTTC: row.amountTTC, currency: row.currency, chargedAmount: charge.amount, chargedCurrency: charge.currency, rate: charge.rate, resumed: true };
      }
      await repo.update({ id: row.id, status: 'initiated' }, { status: 'expired', checkoutUrl: null });
    }

    const payment = await repo.save(repo.create({
      userId: owner.id, planCode: plan.code, planName: plan.name, billingCycle: cycle, periodMonths: cycle === 'annual' ? 12 : 1,
      amountHT: ht, vatRate, amountTTC: ttc, currency, method: 'card', provider: ONLINE_PROVIDER, status: 'initiated', declaredBy: 'client',
      chargedAmount: charge.amount, chargedCurrency: charge.currency,
      note: charge.currency !== currency ? `Débité par Flouci : ${frNumber(charge.amount, 3)} ${charge.currency} (1 ${currency} = ${frNumber(charge.rate)} ${charge.currency})` : null,
      expiresAt: new Date(now.getTime() + CHECKOUT_MINUTES * 60_000), returnBase: ctx.returnBase,
    }));
    try {
      const session = await this.gateway.createCheckout({
        orderId: String(payment.id), amountMinor: charge.minor,
        webhookUrl: `${ctx.apiBase}/public/payments/flouci/webhook`,
        successUrl: `${ctx.returnBase}/subscription?checkout=${payment.id}`,
        failUrl: `${ctx.returnBase}/subscription?checkout=${payment.id}`,
        lifespanMinutes: CHECKOUT_MINUTES,
      });
      payment.providerRef = session.providerRef;
      payment.checkoutUrl = session.payUrl;
      await repo.save(payment);
    } catch (e: any) {
      await repo.update({ id: payment.id }, { status: 'expired', note: `Ouverture du paiement refusée : ${String(e?.message || e).slice(0, 400)}` });
      this.logger.error(`Paiement en ligne non ouvert (compte ${owner.id}) : ${e?.message || e}`);
      throw new BadGatewayException({ statusCode: 502, error: 'Bad Gateway', code: 'PAYMENT_PROVIDER_ERROR', message: 'Le prestataire de paiement ne répond pas. Réessayez dans un instant.' });
    }
    await this.audit.record({ userId: owner.id, actorId: ctx.actorId, action: 'checkout_started', entity: 'subscription_payment', entityId: payment.id, details: { planCode: plan.code, cycle, amountTTC: ttc, currency, chargedAmount: charge.amount, chargedCurrency: charge.currency, rate: charge.rate } });
    return { id: payment.id, payUrl: payment.checkoutUrl!, expiresAt: payment.expiresAt, amountTTC: ttc, currency, chargedAmount: charge.amount, chargedCurrency: charge.currency, rate: charge.rate, resumed: false };
  }

  /**
   * Demande au prestataire où en est un paiement en ligne et, s'il est encaissé, ouvre l'abonnement — tout de suite et
   * sans administrateur. Appelé au retour du client, par la notification du prestataire et par le balayage périodique :
   * les trois peuvent arriver en même temps, un seul ouvre la période (ligne verrouillée).
   */
  async confirmCheckout(where: { id?: number; providerRef?: string; ownerId?: number }, now = new Date()): Promise<{ status: 'paid' | 'pending' | 'expired' | 'unknown'; payment: SubscriptionPayment | null }> {
    const repo = this.ds.getRepository(SubscriptionPayment);
    const criteria: Record<string, any> = { provider: ONLINE_PROVIDER };
    if (where.id) criteria.id = where.id;
    else if (where.providerRef) criteria.providerRef = where.providerRef;
    else return { status: 'unknown', payment: null };
    if (where.ownerId) criteria.userId = where.ownerId;
    const row = await repo.findOne({ where: criteria });
    if (!row) return { status: 'unknown', payment: null };
    if (row.status === 'validated') return { status: 'paid', payment: row };
    if (!OPEN_ONLINE_STATUSES.includes(row.status) || !row.providerRef) return { status: 'expired', payment: row };

    let remote;
    try {
      remote = await this.gateway.fetchPayment(row.providerRef);
    } catch (e: any) {
      this.logger.warn(`État du paiement ${row.id} illisible chez le prestataire : ${e?.message || e}`);
      return { status: row.status === 'expired' ? 'expired' : 'pending', payment: row };
    }
    if (remote.paid) {
      // Le paiement confirmé doit être CELUI que nous avons ouvert : même commande, même montant, même devise. Seul notre
      // serveur ouvre les paiements (clé secrète), le client ne peut donc pas en modifier le montant : ces contrôles sont
      // une double sécurité. Le montant comparé est celui réellement débité (en dinars), figé à l'ouverture du paiement.
      const chargedCurrency = row.chargedCurrency || row.currency;
      const expected = toMinorUnits(row.chargedAmount ?? row.amountTTC, chargedCurrency);
      const mismatch =
        (remote.orderId !== null && remote.orderId !== String(row.id)) ||
        (remote.currency !== null && remote.currency !== chargedCurrency) ||
        (remote.amountMinor !== null && Math.abs(remote.amountMinor - expected) > 1);
      if (mismatch) {
        this.logger.error(`Paiement ${row.id} : la confirmation du prestataire ne correspond pas (commande ${remote.orderId}, ${remote.amountMinor} ${remote.currency} ; attendu ${expected} ${chargedCurrency}). Abonnement NON ouvert.`);
        await this.audit.record({ userId: row.userId, actorId: null, action: 'payment_mismatch', entity: 'subscription_payment', entityId: row.id, details: { orderId: remote.orderId, amountMinor: remote.amountMinor, currency: remote.currency, expected, expectedCurrency: chargedCurrency } });
        return { status: 'pending', payment: row };
      }
      return { status: 'paid', payment: await this.settleOnline(row.id, remote.method) };
    }
    // Refusé ou expiré chez Flouci : plus aucun paiement n'est attendu sur cette page (le client peut en ouvrir une autre).
    // Si le client la paie quand même plus tard, l'encaissement reste reconnu (« expired » fait partie des états relus).
    if (remote.closed && row.status === 'initiated') {
      await repo.update({ id: row.id, status: 'initiated' }, { status: 'expired', checkoutUrl: null });
      row.status = 'expired';
      row.checkoutUrl = null;
      return { status: 'expired', payment: row };
    }
    // Pas (encore) payé. Dix minutes après la fin de validité de la page, on n'attend plus.
    if (row.status === 'initiated' && row.expiresAt && new Date(row.expiresAt).getTime() + 10 * 60_000 < now.getTime()) {
      await repo.update({ id: row.id, status: 'initiated' }, { status: 'expired', checkoutUrl: null });
      row.status = 'expired';
    }
    return { status: row.status === 'expired' ? 'expired' : 'pending', payment: row };
  }

  /** Enregistre un paiement en ligne encaissé : une seule fois, même si la confirmation arrive par plusieurs chemins. */
  private async settleOnline(paymentId: number, method: string | null): Promise<SubscriptionPayment> {
    const result = await this.ds.transaction(async (em) => {
      const payment = await em.getRepository(SubscriptionPayment).findOne({ where: { id: paymentId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw new NotFoundException('Paiement introuvable');
      if (payment.status === 'validated') return { payment, owner: null as User | null };
      if (!OPEN_ONLINE_STATUSES.includes(payment.status)) throw new ConflictException('Ce paiement a déjà été traité.');
      if (method === 'card' || method === 'flouci' || method === 'edinar' || method === 'other') payment.method = method;
      payment.reference = payment.providerRef;
      return this.applyValidated(em, payment, null, new Date());
    });
    if (result.owner) {
      await this.audit.record({ userId: result.owner.id, actorId: null, action: 'payment_received', entity: 'subscription_payment', entityId: result.payment.id, details: { provider: ONLINE_PROVIDER, receipt: result.payment.receiptNumber, amountTTC: result.payment.amountTTC, currency: result.payment.currency, periodEnd: result.payment.periodEnd } });
      this.receiptMail(result.owner, result.payment, true);
    }
    return result.payment;
  }

  /**
   * Filet de sécurité : relit chez le prestataire les paiements ouverts récemment (client qui a payé puis fermé
   * l'onglet avant de revenir sur le site). Lancé par le balayage périodique.
   */
  async reconcileCheckouts(now = new Date()): Promise<{ checked: number; paid: number }> {
    if (!this.gateway.isConfigured()) return { checked: 0, paid: 0 };
    const rows = await this.ds.getRepository(SubscriptionPayment).createQueryBuilder('p')
      .where(`p.provider = :provider AND p.providerRef IS NOT NULL AND p.status IN (:...open) AND p.createdAt > :since`, { provider: ONLINE_PROVIDER, open: OPEN_ONLINE_STATUSES, since: new Date(now.getTime() - 6 * HOUR) })
      .orderBy('p.id', 'DESC').take(100).getMany();
    let paid = 0;
    for (const row of rows) {
      const out = await this.confirmCheckout({ id: row.id }, now).catch(() => null);
      if (out?.status === 'paid') paid++;
    }
    return { checked: rows.length, paid };
  }

  /**
   * Support : « j'ai payé mais mon accès n'est pas ouvert ». Relit tout de suite chez Flouci l'état du paiement et, s'il
   * est encaissé, ouvre l'abonnement. Fonctionne aussi pour une page de paiement que le client a payée après son expiration.
   */
  async recheckPayment(paymentId: number, adminId: number) {
    const row = await this.ds.getRepository(SubscriptionPayment).findOne({ where: { id: paymentId } });
    if (!row || row.provider !== ONLINE_PROVIDER) throw new NotFoundException('Paiement en ligne introuvable.');
    if (!row.providerRef) throw new ConflictException('Ce paiement n’a jamais été ouvert chez le prestataire : il n’y a rien à relire.');
    const out = await this.confirmCheckout({ id: paymentId });
    await this.audit.record({ userId: row.userId, actorId: adminId, action: 'payment_rechecked', entity: 'subscription_payment', entityId: row.id, details: { before: row.status, result: out.status } });
    return { status: out.status, payment: out.payment };
  }

  /**
   * Remboursement d'un paiement validé, décidé par l'administrateur. L'argent se rend depuis le tableau de bord Flouci
   * (Transactions) ; ici l'abonnement est remis en accord et la trace est gardée.
   * Seul le DERNIER paiement validé d'un compte peut être remboursé : la période qu'il avait ouverte est alors retirée
   * (l'abonnement revient à sa date d'avant, ou à l'essai s'il court encore). Le numéro de reçu reste attaché au paiement.
   */
  async refundPayment(paymentId: number, reason: string | undefined, adminId: number) {
    const why = (reason || '').trim().slice(0, 300) || null;
    const { payment, owner } = await this.ds.transaction(async (em) => {
      const repo = em.getRepository(SubscriptionPayment);
      const payment = await repo.findOne({ where: { id: paymentId }, lock: { mode: 'pessimistic_write' } });
      if (!payment) throw new NotFoundException('Paiement introuvable');
      if (payment.status !== 'validated') throw new ConflictException('Seul un paiement validé peut être remboursé.');
      const owner = await this.owner(payment.userId, em);
      const validated = await repo.find({ where: { userId: payment.userId, status: 'validated' }, order: { id: 'DESC' } });
      const newer = validated.find((p) => p.id > payment.id);
      if (newer) throw new ConflictException(`Remboursez d’abord le paiement le plus récent (${newer.receiptNumber}) : l’abonnement se retire période après période.`);
      const previous = validated.find((p) => p.id < payment.id) || null;

      const now = new Date();
      const periodStart = payment.periodStart ? new Date(payment.periodStart) : now;
      owner.renewalReminderStage = 0;
      owner.statusChangedAt = now;
      if (previous) {
        // Un paiement plus ancien subsiste : l'abonnement revient à sa formule et à son échéance.
        await this.applyPlan(owner, previous.planCode, previous.billingCycle, em);
        owner.subscriptionEnd = periodStart;
      } else {
        owner.subscriptionEnd = null;
        owner.subscriptionStart = null;
      }
      const trialEnd = owner.trialEndsAt ? new Date(owner.trialEndsAt) : null;
      if (!previous && trialEnd && trialEnd.getTime() > now.getTime()) {
        // Remboursé pendant l'essai : l'essai reprend où il en était, aucun jour gratuit n'est perdu.
        owner.accountStatus = 'TRIAL';
        owner.statusReason = null;
      } else if (previous && periodStart.getTime() > now.getTime()) {
        owner.accountStatus = 'ACTIVE';
        owner.statusReason = null;
      } else if (owner.accountStatus !== 'SUSPENDED' && owner.accountStatus !== 'CANCELLED') {
        // Plus aucune période payée en cours : l'accès se referme, les données restent.
        owner.accountStatus = 'EXPIRED';
        owner.statusReason = 'SUBSCRIPTION_EXPIRED';
        if (!previous) owner.subscriptionEnd = periodStart;
      }
      await em.save(User, owner);

      payment.status = 'refunded';
      payment.rejectReason = why;
      await repo.save(payment);
      return { payment, owner };
    });
    await this.audit.record({ userId: owner.id, actorId: adminId, action: 'payment_refunded', entity: 'subscription_payment', entityId: payment.id, details: { receipt: payment.receiptNumber, amountTTC: payment.amountTTC, currency: payment.currency, reason: why } });
    void this.mail.trySend({
      to: owner.email,
      ...refundMail({ lang: pickMailLang(owner.language), name: owner.name, amount: payment.amountTTC, currency: payment.currency, receiptNumber: payment.receiptNumber, reason: why, url: `${frontend()}/subscription` }),
    });
    return { payment, account: this.view(owner, await this.settings.get()) };
  }

  /**
   * Liste de contrôle « mise en production » du paiement en ligne : ce qui empêche d'encaisser de vrais clients, et ce qu'il
   * vaut mieux régler avant. Calculée sans appeler Flouci (voir PaymentGatewayService.probe pour le test de connexion).
   */
  async onlineReadiness(settings: PlatformSettings) {
    const online = this.onlinePayment(settings);
    const api = apiPublicUrl();
    const sites = allowedOrigins();
    const publicHttps = (url: string) => {
      try {
        const u = new URL(url);
        return u.protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(u.hostname);
      } catch { return false; }
    };
    const plans = await this.plans('public');
    const priced = plans.filter((p) => Number(p.priceMonthly) > 0 || Number(p.priceAnnual) > 0);
    const production = process.env.NODE_ENV === 'production';
    type Level = 'error' | 'warn';
    const checks: Array<{ key: string; ok: boolean; level: Level; message: string }> = [];
    const add = (key: string, ok: boolean, level: Level, good: string, bad: string) => checks.push({ key, ok, level, message: ok ? good : bad });

    const rate = this.gateway.rate(settings.currency);
    const cur = String(settings.currency || '').toUpperCase();
    add('credentials', this.gateway.isConfigured(), 'error', 'Jetons public et privé Flouci définis sur le serveur.', 'Définissez FLOUCI_PUBLIC_TOKEN et FLOUCI_PRIVATE_TOKEN sur le serveur de l’API (tableau de bord Flouci › Accepter en ligne › API).');
    add('currency', rate !== null, 'error',
      cur === 'TND' ? 'Formules en dinars : montant débité tel quel par Flouci.' : `Formules en ${cur}, débitées en dinars par Flouci au taux 1 ${cur} = ${frNumber(rate)} TND (FLOUCI_RATE_${cur}).`,
      `Flouci encaisse uniquement en dinars : définissez FLOUCI_RATE_${cur} (ex. 3.10 pour 1 ${cur} = 3,10 TND) sur le serveur de l’API, ou passez la devise des formules en TND.`);
    add('plans', priced.length > 0, 'error', `${priced.length} formule(s) publiée(s) avec un prix.`, 'Aucune formule publiée avec un prix : publiez-en au moins une dans « Formules et tarifs ».');
    add('mode', online.mode === 'production', production ? 'warn' : 'warn', 'Mode production : les paiements sont réels.', 'Mode test (FLOUCI_ENV=test) : avec les jetons de l’application « TEST APP », aucun débit réel. Pour encaisser de vrais clients, mettez les jetons de production et retirez FLOUCI_ENV.');
    add('apiUrl', publicHttps(api), production ? 'error' : 'warn', `Flouci appellera ${api}/public/payments/flouci/webhook.`, `L’adresse publique de l’API (${api}) n’est pas une adresse https accessible depuis Internet : Flouci ne pourrait pas confirmer les paiements. Définissez API_PUBLIC_URL (ex. https://api.votre-domaine.tn).`);
    add('siteUrl', sites.some(publicHttps), production ? 'error' : 'warn', `Retour des clients sur ${sites.filter(publicHttps)[0] || sites[0]}.`, 'FRONTEND_URL n’est pas une adresse https publique : les liens des emails et le retour de paiement pointeraient vers un site inaccessible.');
    add('mail', this.mail.isConfigured(), 'warn', 'Envoi d’emails configuré : reçus, rappels et code de vérification partent.', 'Envoi d’emails non configuré : aucun reçu ni rappel ne sera envoyé (variables SMTP_*).');
    add('issuer', !!(settings.issuerName && settings.issuerTaxId), 'warn', 'Identité légale de l’éditeur renseignée : elle figure sur les reçus.', 'Renseignez la raison sociale et le matricule fiscal de l’éditeur : ils figureront sur les reçus remis aux clients.');

    const blocking = checks.filter((c) => !c.ok && c.level === 'error');
    return {
      enabled: online.enabled, mode: online.mode, provider: online.provider,
      webhookUrl: `${api}/public/payments/flouci/webhook`,
      siteUrls: sites.filter((s) => s !== 'http://localhost:3000' || sites.length === 1),
      // « prêt » : un client peut payer ; « live » : de vrais paiements, et rien d'important à corriger.
      ready: online.enabled && blocking.length === 0,
      live: online.enabled && online.mode === 'production' && checks.every((c) => c.ok),
      checks,
    };
  }

  async rejectPayment(paymentId: number, reason: string | undefined, adminId: number) {
    const repo = this.ds.getRepository(SubscriptionPayment);
    const payment = await repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== 'pending') throw new ConflictException('Ce paiement a déjà été traité.');
    payment.status = 'rejected';
    payment.rejectReason = (reason || '').trim().slice(0, 300) || null;
    payment.validatedAt = new Date();
    payment.validatedBy = adminId;
    await repo.save(payment);
    await this.audit.record({ userId: payment.userId, actorId: adminId, action: 'payment_rejected', entity: 'subscription_payment', entityId: payment.id, details: { reason: payment.rejectReason } });
    const owner = await this.users().findOne({ where: { id: payment.userId } });
    if (owner) {
      void this.mail.trySend({ to: owner.email, ...paymentRejectedMail({ lang: pickMailLang(owner.language), name: owner.name, amount: payment.amountTTC, currency: payment.currency, reason: payment.rejectReason, url: `${frontend()}/subscription` }) });
    }
    return payment;
  }

  /** Le client annule sa propre déclaration tant qu'elle n'est pas traitée. */
  async cancelOwnPayment(ownerId: number, paymentId: number) {
    const repo = this.ds.getRepository(SubscriptionPayment);
    const payment = await repo.findOne({ where: { id: paymentId, userId: ownerId } });
    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== 'pending') throw new ConflictException('Ce paiement a déjà été traité.');
    payment.status = 'cancelled';
    return repo.save(payment);
  }

  /** Historique affiché au client : paiements réels (les pages de paiement abandonnées n'y figurent pas). */
  async paymentsOf(ownerId: number) {
    return this.ds.getRepository(SubscriptionPayment).createQueryBuilder('p')
      .where('p.userId = :ownerId AND p.status NOT IN (:...open)', { ownerId, open: OPEN_ONLINE_STATUSES })
      .orderBy('p.createdAt', 'DESC').addOrderBy('p.id', 'DESC').take(200).getMany();
  }

  async receipt(ownerId: number | null, paymentId: number) {
    const payment = await this.ds.getRepository(SubscriptionPayment).findOne({ where: ownerId === null ? { id: paymentId } : { id: paymentId, userId: ownerId } });
    if (!payment || payment.status !== 'validated') throw new NotFoundException('Reçu introuvable');
    const owner = await this.users().findOne({ where: { id: payment.userId } });
    const [company] = await this.ds.query(`SELECT "legalName", "taxId", "address", "city", "postalCode" FROM "companies" WHERE "userId" = $1`, [payment.userId]).catch(() => []);
    const s = await this.settings.get();
    // Identité de l'éditeur (réglages de la plateforme) : sans raison sociale, le reçu garde son en-tête « Inovexa ERP ».
    const issuer = s.issuerName ? { name: s.issuerName, taxId: s.issuerTaxId, address: s.issuerAddress, registry: s.issuerRegistry, email: s.supportEmail, phone: s.supportPhone } : null;
    return {
      receiptNumber: payment.receiptNumber, issuedAt: payment.validatedAt, planName: payment.planName, billingCycle: payment.billingCycle,
      periodStart: payment.periodStart, periodEnd: payment.periodEnd, amountHT: payment.amountHT, vatRate: payment.vatRate,
      vatAmount: round3(payment.amountTTC - payment.amountHT), amountTTC: payment.amountTTC, currency: payment.currency,
      method: payment.method, reference: payment.reference,
      // Paiement en ligne converti en dinars par Flouci : montant réellement débité (absent si même devise ou hors ligne).
      charged: payment.chargedAmount != null && payment.chargedCurrency && payment.chargedCurrency !== payment.currency ? { amount: payment.chargedAmount, currency: payment.chargedCurrency } : null,
      issuer,
      customer: { name: company?.legalName || owner?.companyName || owner?.name || '', taxId: company?.taxId || null, address: [company?.address, company?.postalCode, company?.city].filter(Boolean).join(' ') || null, email: owner?.email || null },
      notice: 'Reçu de paiement d’abonnement. Il ne remplace pas la facture légale émise par l’éditeur.',
    };
  }

  /** Paiements de tous les comptes, ceux en attente d'abord. */
  async adminPayments(f: { status?: string; userId?: number; limit?: number; offset?: number }) {
    const limit = Math.min(Math.max(Number(f.limit) || 50, 1), 200);
    const offset = Math.max(Number(f.offset) || 0, 0);
    const params: any[] = [];
    const cond: string[] = [];
    if (f.status) { params.push(String(f.status)); cond.push(`"status" = $${params.length}`); }
    // Sans filtre d'état : les pages de paiement en ligne non abouties ne sont pas des paiements.
    else cond.push(`"status" NOT IN ('initiated', 'expired')`);
    if (f.userId) { params.push(Number(f.userId)); cond.push(`"userId" = $${params.length}`); }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const [{ total }] = await this.ds.query(`SELECT COUNT(*)::int AS total FROM "subscription_payments" ${where}`, params);
    const idRows: Array<{ id: number }> = await this.ds.query(
      `SELECT "id" FROM "subscription_payments" ${where} ORDER BY CASE "status" WHEN 'pending' THEN 0 ELSE 1 END, "createdAt" DESC, "id" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const ids = idRows.map((r) => r.id);
    const payments = ids.length ? await this.ds.getRepository(SubscriptionPayment).find({ where: { id: In(ids) } }) : [];
    const byId = new Map(payments.map((p) => [p.id, p]));
    const ownerIds = Array.from(new Set(payments.map((p) => p.userId)));
    const owners = ownerIds.length ? await this.users().find({ where: { id: In(ownerIds) }, select: ['id', 'email', 'name', 'companyName'] }) : [];
    const ownerBy = new Map(owners.map((o) => [o.id, o]));
    const items = ids.map((id) => byId.get(id)).filter((p): p is SubscriptionPayment => !!p).map((p) => {
      const o = ownerBy.get(p.userId);
      return { ...p, account: { id: p.userId, email: o?.email ?? null, name: o?.name ?? null, companyName: o?.companyName ?? null } };
    });
    return { total, limit, offset, items };
  }

  // ───────────── Balayage périodique : expirations et rappels ─────────────

  /**
   * Passe en EXPIRED les essais et abonnements échus, et envoie les rappels avant échéance.
   * L'accès est de toute façon recalculé à chaque requête : ce balayage sert aux emails et aux statistiques.
   */
  async sweep(now = new Date()) {
    const settings = await this.settings.get();
    // Les paiements en ligne d'abord : un client qui a payé puis fermé l'onglet est activé AVANT que le balayage ne
    // juge son essai terminé (sinon il pourrait être refermé juste après avoir payé).
    const checkouts = await this.reconcileCheckouts(now).catch((e) => { this.logger.warn(`Paiements en ligne non relus : ${e?.message || e}`); return { checked: 0, paid: 0 }; });
    const owners = await this.users().createQueryBuilder('u')
      .where(`u.role = 'client' AND u.ownerId IS NULL AND u.isActive = true AND u.accountStatus IN ('TRIAL','ACTIVE')`)
      .getMany();
    let expired = 0, reminders = 0;
    for (const owner of owners) {
      const access = resolveAccess(owner, now, {});
      if (access.persistExpired) {
        await this.persistExpired(owner, access.reason === 'SUBSCRIPTION_EXPIRED' ? 'SUBSCRIPTION_EXPIRED' : 'TRIAL_EXPIRED');
        expired++;
        continue;
      }
      if (access.endsAt === null) continue;
      const left = access.endsAt.getTime() - now.getTime();
      if (owner.accountStatus === 'TRIAL' && left <= settings.trialReminderHours * HOUR && owner.trialReminderStage < 1) {
        // « Réclamation » atomique du rappel : une seule instance l'envoie.
        const claim = await this.users().update({ id: owner.id, trialReminderStage: owner.trialReminderStage }, { trialReminderStage: 1 });
        if (!claim.affected) continue;
        reminders++;
        void this.mail.trySend({ to: owner.email, ...trialReminderMail({ lang: pickMailLang(owner.language), name: owner.name, endsAt: access.endsAt, url: `${frontend()}/dashboard/billing` }) });
      } else if (owner.accountStatus === 'ACTIVE') {
        const stage = left <= DAY ? 2 : left <= settings.renewalReminderDays * DAY ? 1 : 0;
        if (stage > owner.renewalReminderStage) {
          const claim = await this.users().update({ id: owner.id, renewalReminderStage: owner.renewalReminderStage }, { renewalReminderStage: stage });
          if (!claim.affected) continue;
          reminders++;
          void this.mail.trySend({ to: owner.email, ...renewalReminderMail({ lang: pickMailLang(owner.language), name: owner.name, endsAt: access.endsAt, url: `${frontend()}/dashboard/billing` }) });
        }
      }
    }
    return { checked: owners.length, expired, reminders, checkouts };
  }

  // ───────────── Tableau de bord administrateur ─────────────

  /** Chiffres calculés uniquement à partir des comptes et des paiements VALIDÉS enregistrés en base. */
  async overview(range: { from?: string; to?: string }) {
    const settings = await this.settings.get();
    const now = new Date();
    const to = range.to ? new Date(range.to) : now;
    const from = range.from ? new Date(range.from) : new Date(to.getTime() - 30 * DAY);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) throw new BadRequestException('Période invalide.');
    const toEnd = new Date(to.getTime());
    if (range.to && /^\d{4}-\d{2}-\d{2}$/.test(range.to)) toEnd.setUTCHours(23, 59, 59, 999);
    const inRange = (d: Date | null | undefined) => !!d && new Date(d).getTime() >= from.getTime() && new Date(d).getTime() <= toEnd.getTime();

    const owners = await this.users().find({
      where: { role: 'client', ownerId: IsNull() },
      select: ['id', 'role', 'accountStatus', 'statusReason', 'statusChangedAt', 'trialStartedAt', 'trialEndsAt', 'subscriptionStart', 'subscriptionEnd',
        'expiryEnforced', 'emailVerifiedAt', 'signupSource', 'sector', 'planCode', 'billingCycle', 'modules', 'isActive', 'createdAt'],
    });
    const payments = await this.ds.getRepository(SubscriptionPayment).find({ where: { status: 'validated' } });
    const pendingPayments = await this.ds.getRepository(SubscriptionPayment).count({ where: { status: 'pending' } });
    const sectors = await this.ds.getRepository(Sector).find({ select: ['code', 'name'] });
    const plans = await this.ds.getRepository(Plan).find({ select: ['code', 'name'] });

    const paidOwnerIds = new Set(payments.map((p) => p.userId));
    const counts = { total: owners.length, trial: 0, active: 0, expired: 0, expiredTrials: 0, suspended: 0, cancelled: 0, paying: 0 };
    const byPlan = new Map<string, number>();
    const bySector = new Map<string, number>();
    const byModule = new Map<string, number>();
    let mrr = 0;

    for (const o of owners) {
      const a = resolveAccess(o, now, {});
      const status = o.isActive === false ? 'SUSPENDED' : a.status;
      if (status === 'TRIAL') counts.trial++;
      else if (status === 'ACTIVE') counts.active++;
      else if (status === 'EXPIRED') { counts.expired++; if (a.reason === 'TRIAL_EXPIRED') counts.expiredTrials++; }
      else if (status === 'SUSPENDED') counts.suspended++;
      else if (status === 'CANCELLED') counts.cancelled++;

      bySector.set(o.sector || '', (bySector.get(o.sector || '') || 0) + 1);
      if (status === 'TRIAL' || status === 'ACTIVE') {
        const mods = o.modules && Object.keys(o.modules).length ? o.modules : null;
        for (const key of MODULE_KEYS) if (!mods || mods[key] === true) byModule.set(key, (byModule.get(key) || 0) + 1);
      }
      if (status === 'ACTIVE') {
        if (o.planCode) byPlan.set(o.planCode, (byPlan.get(o.planCode) || 0) + 1);
        // Paiement validé dont la période couvre aujourd'hui : c'est lui qui compte dans le revenu récurrent. À défaut, celui
        // dont la période n'a pas encore commencé (client qui a payé pendant son essai : elle démarre à la fin de l'essai).
        const current = payments
          .filter((p) => p.userId === o.id && p.periodStart && p.periodEnd && new Date(p.periodEnd).getTime() > now.getTime())
          .sort((x, y) => new Date(x.periodStart!).getTime() - new Date(y.periodStart!).getTime())[0];
        if (current) { counts.paying++; mrr += current.amountHT / Math.max(1, current.periodMonths); }
      }
    }

    // Séries mensuelles sur la période
    const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const months: string[] = [];
    for (let d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)); d.getTime() <= toEnd.getTime() && months.length < 60; d.setUTCMonth(d.getUTCMonth() + 1)) months.push(monthKey(d));
    const revenueByMonth = new Map(months.map((m) => [m, { ht: 0, ttc: 0, payments: 0 }]));
    const signupsByMonth = new Map(months.map((m) => [m, 0]));
    let revenueHT = 0, revenueTTC = 0;
    for (const p of payments) {
      if (!inRange(p.validatedAt)) continue;
      revenueHT += p.amountHT; revenueTTC += p.amountTTC;
      const slot = revenueByMonth.get(monthKey(new Date(p.validatedAt!)));
      if (slot) { slot.ht += p.amountHT; slot.ttc += p.amountTTC; slot.payments++; }
    }
    const signups = owners.filter((o) => inRange(o.createdAt));
    for (const o of signups) { const k = monthKey(new Date(o.createdAt)); if (signupsByMonth.has(k)) signupsByMonth.set(k, signupsByMonth.get(k)! + 1); }

    // Conversions : sur les comptes inscrits pendant la période
    const signupsPaid = signups.filter((o) => paidOwnerIds.has(o.id)).length;
    const trialsEnded = owners.filter((o) => o.trialEndsAt && inRange(o.trialEndsAt) && new Date(o.trialEndsAt).getTime() <= now.getTime());
    const trialsConverted = trialsEnded.filter((o) => paidOwnerIds.has(o.id)).length;
    const cancellations = owners.filter((o) => o.accountStatus === 'CANCELLED' && inRange(o.statusChangedAt)).length;
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
    const named = (map: Map<string, number>, names: Map<string, string>, none: string) =>
      Array.from(map.entries()).map(([code, count]) => ({ code: code || null, name: code ? names.get(code) || code : none, count })).sort((a, b) => b.count - a.count);

    return {
      range: { from: from.toISOString(), to: toEnd.toISOString() },
      currency: settings.currency,
      customers: counts,
      newRegistrations: signups.length,
      mrr: round3(mrr),
      revenue: { ht: round3(revenueHT), ttc: round3(revenueTTC) },
      revenueByMonth: months.map((m) => ({ month: m, ht: round3(revenueByMonth.get(m)!.ht), ttc: round3(revenueByMonth.get(m)!.ttc), payments: revenueByMonth.get(m)!.payments })),
      registrationsByMonth: months.map((m) => ({ month: m, count: signupsByMonth.get(m)! })),
      conversion: {
        signups: signups.length, signupsPaid, subscriptionRate: pct(signupsPaid, signups.length),
        trialsEnded: trialsEnded.length, trialsConverted, trialToPaidRate: pct(trialsConverted, trialsEnded.length),
      },
      cancellations,
      plans: named(byPlan, new Map(plans.map((p) => [p.code, p.name])), 'Sans formule'),
      modules: Array.from(byModule.entries()).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
      sectors: named(bySector, new Map(sectors.map((s) => [s.code, s.name])), 'Non renseigné'),
      pendingPayments,
      note: 'Revenu récurrent mensuel (MRR) = abonnements payés en cours ou payés d’avance (paiements validés), ramenés au mois, hors taxes.',
    };
  }

  /** Liste des comptes pour l'administrateur : recherche, filtres, pagination côté serveur. */
  async accounts(f: { q?: string; status?: string; sector?: string; plan?: string; source?: string; limit?: number; offset?: number; sort?: string }) {
    const settings = await this.settings.get();
    const now = new Date();
    const qb = this.users().createQueryBuilder('u').where(`u.role = 'client' AND u.ownerId IS NULL`);
    if (f.q) qb.andWhere('(LOWER(u.email) LIKE :q OR LOWER(u.name) LIKE :q OR LOWER(COALESCE(u.companyName, \'\')) LIKE :q OR COALESCE(u.phone, \'\') LIKE :q)', { q: `%${f.q.trim().toLowerCase()}%` });
    if (f.sector) qb.andWhere(f.sector === 'none' ? 'u.sector IS NULL' : 'u.sector = :sector', { sector: f.sector });
    if (f.plan) qb.andWhere(f.plan === 'none' ? 'u.planCode IS NULL' : 'u.planCode = :plan', { plan: f.plan });
    if (f.source) qb.andWhere('u.signupSource = :source', { source: f.source });
    const sort = f.sort === 'name' ? 'u.companyName' : f.sort === 'end' ? 'u.subscriptionEnd' : f.sort === 'login' ? 'u.lastLoginAt' : 'u.createdAt';
    qb.orderBy(sort, f.sort === 'name' ? 'ASC' : 'DESC', 'NULLS LAST').addOrderBy('u.id', 'DESC');

    // L'état réel dépend de l'heure (essai échu non encore enregistré) : le filtre d'état s'applique après calcul.
    const all = await qb.getMany();
    const rows = all
      .map((u) => ({ u, a: this.view(u, settings, now) }))
      .map(({ u, a }) => ({ u, a: u.isActive === false && a.status !== 'CANCELLED' ? { ...a, status: 'SUSPENDED', blocked: true, reason: 'SUSPENDED' } : a }))
      .filter(({ a }) => !f.status || a.status === f.status);
    const total = rows.length;
    const limit = Math.min(Math.max(Number(f.limit) || 25, 1), 200);
    const offset = Math.max(Number(f.offset) || 0, 0);
    const page = rows.slice(offset, offset + limit);
    const ids = page.map((r) => r.u.id);
    const team: Array<{ ownerId: number; n: number }> = ids.length
      ? await this.ds.query(`SELECT "ownerId", COUNT(*)::int AS n FROM "users" WHERE "ownerId" = ANY($1) AND "isActive" = true GROUP BY "ownerId"`, [ids])
      : [];
    const pay: Array<{ userId: number; pending: number; validated: number; paid: string | null }> = ids.length
      ? await this.ds.query(
        `SELECT "userId", COUNT(*) FILTER (WHERE "status" = 'pending')::int AS pending, COUNT(*) FILTER (WHERE "status" = 'validated')::int AS validated,
                SUM("amountTTC") FILTER (WHERE "status" = 'validated') AS paid FROM "subscription_payments" WHERE "userId" = ANY($1) GROUP BY "userId"`, [ids])
      : [];
    const teamBy = new Map(team.map((t) => [t.ownerId, t.n]));
    const payBy = new Map(pay.map((p) => [p.userId, p]));
    return {
      total, limit, offset,
      items: page.map(({ u, a }) => {
        const p = payBy.get(u.id);
        return {
          id: u.id, email: u.email, name: u.name, companyName: u.companyName, phone: u.phone, sector: u.sector, signupSource: u.signupSource,
          createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, isActive: u.isActive, modules: u.modules || {}, account: a,
          users: 1 + (teamBy.get(u.id) || 0),
          paymentStatus: p?.pending ? 'pending' : p?.validated ? 'paid' : 'none',
          totalPaid: p?.paid ? Number(p.paid) : 0,
        };
      }),
    };
  }

  /** Fiche complète d'un compte : abonnement, société, équipe, paiements, activité récente, volumes de données. */
  async accountDetail(ownerId: number) {
    const settings = await this.settings.get();
    const owner = await this.owner(ownerId);
    const [company] = await this.ds.query(`SELECT "legalName","tradeName","legalForm","taxId","address","city","postalCode","country","phone","email","website","currency","defaultVatRate" FROM "companies" WHERE "userId" = $1`, [ownerId]).catch(() => []);
    const team = await this.users().find({ where: { ownerId }, select: ['id', 'email', 'name', 'role', 'isActive', 'lastLoginAt', 'createdAt'], order: { createdAt: 'ASC' } });
    const activity = await this.ds.query(
      `SELECT "id","actorEmail","action","entity","entityId","method","path","status","createdAt" FROM "audit_logs" WHERE "userId" = $1 ORDER BY "createdAt" DESC, "id" DESC LIMIT 60`, [ownerId],
    ).catch(() => []);
    const usage: Record<string, number> = {};
    for (const [key, table] of [['products', 'products'], ['clients', 'clients'], ['suppliers', 'suppliers'], ['documents', 'documents'], ['sales', 'sales'], ['purchases', 'purchases'], ['employees', 'employees']] as const) {
      const [row] = await this.ds.query(`SELECT COUNT(*)::int AS n FROM "${table}" WHERE "userId" = $1`, [ownerId]).catch(() => [{ n: 0 }]);
      usage[key] = row?.n ?? 0;
    }
    return {
      id: owner.id, email: owner.email, name: owner.name, companyName: owner.companyName, phone: owner.phone, sector: owner.sector,
      signupSource: owner.signupSource, createdAt: owner.createdAt, lastLoginAt: owner.lastLoginAt, isActive: owner.isActive,
      twoFactorEnabled: owner.twoFactorEnabled, googleLinked: !!owner.googleSub, appleLinked: !!owner.appleSub, modules: owner.modules || {},
      account: this.view(owner, settings), company: company || null, team, payments: await this.paymentsOf(ownerId), activity, usage,
    };
  }
}
