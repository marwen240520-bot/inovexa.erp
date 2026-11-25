/**
 * État d'un compte SaaS et droit d'accès à l'ERP — décidé UNIQUEMENT ici, côté serveur.
 *
 * Le navigateur ne décide jamais : il affiche ce que renvoient /auth/me et /billing/subscription. Modifier
 * l'horloge du poste ou le localStorage ne change rien, chaque requête API repasse par `resolveAccess`.
 *
 * Le « compte » est le PROPRIÉTAIRE (users.ownerId IS NULL, rôle client) ; ses membres d'équipe héritent de son état.
 */

export const ACCOUNT_STATUSES = ['TRIAL', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export type BlockReason = 'TRIAL_EXPIRED' | 'SUBSCRIPTION_EXPIRED' | 'SUSPENDED' | 'CANCELLED' | 'EMAIL_NOT_VERIFIED';

export const PLATFORM_ROLES = ['admin', 'super_admin'] as const;
export const isPlatformAdmin = (role: unknown): boolean => (PLATFORM_ROLES as readonly string[]).includes(String(role));

/** Modules de l'ERP qu'un abonnement peut activer (mêmes clés que la barre latérale et users.modules). */
export const MODULE_KEYS = [
  'dashboard', 'products', 'categories', 'stock', 'sales', 'purchases', 'pos', 'orders', 'clients', 'suppliers',
  'invoices', 'hr', 'finance', 'logistics', 'production', 'ai', 'reports', 'analytics', 'objectives', 'profile', 'settings',
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
/** Toujours actifs, quel que soit l'abonnement. */
export const CORE_MODULES: readonly string[] = ['dashboard', 'profile', 'settings'];

export interface AccountLike {
  role: string;
  accountStatus?: string | null;
  statusReason?: string | null;
  trialEndsAt?: Date | null;
  subscriptionEnd?: Date | null;
  expiryEnforced?: boolean | null;
  emailVerifiedAt?: Date | null;
  signupSource?: string | null;
}

export interface AccountAccess {
  status: AccountStatus;
  blocked: boolean;
  reason: BlockReason | null;
  /** Fin de la période en cours (essai ou abonnement), si elle existe. */
  endsAt: Date | null;
  /** Secondes restantes avant `endsAt`, calculées avec l'horloge du serveur. */
  remainingSeconds: number | null;
  /** L'état enregistré est encore TRIAL/ACTIVE alors que la période est finie : à enregistrer comme EXPIRED. */
  persistExpired: boolean;
}

const asStatus = (s: unknown): AccountStatus => ((ACCOUNT_STATUSES as readonly string[]).includes(String(s)) ? (s as AccountStatus) : 'ACTIVE');
const ms = (d: Date | null | undefined): number | null => (d ? new Date(d).getTime() : null);

export function resolveAccess(account: AccountLike, now: Date, opts: { requireEmailVerification?: boolean } = {}): AccountAccess {
  const open = (status: AccountStatus, endsAt: number | null): AccountAccess => ({
    status, blocked: false, reason: null, endsAt: endsAt === null ? null : new Date(endsAt),
    remainingSeconds: endsAt === null ? null : Math.max(0, Math.floor((endsAt - now.getTime()) / 1000)), persistExpired: false,
  });
  const closed = (status: AccountStatus, reason: BlockReason, endsAt: number | null, persistExpired = false): AccountAccess => ({
    status, blocked: true, reason, endsAt: endsAt === null ? null : new Date(endsAt), remainingSeconds: endsAt === null ? null : 0, persistExpired,
  });

  // L'administrateur de la plateforme n'a pas d'abonnement.
  if (isPlatformAdmin(account.role)) return open('ACTIVE', null);

  const status = asStatus(account.accountStatus);
  const trialEnd = ms(account.trialEndsAt);
  const subEnd = ms(account.subscriptionEnd);
  const t = now.getTime();

  let access: AccountAccess;
  switch (status) {
    case 'SUSPENDED':
      return closed('SUSPENDED', 'SUSPENDED', null);
    case 'CANCELLED':
      return closed('CANCELLED', 'CANCELLED', subEnd);
    case 'EXPIRED':
      return closed('EXPIRED', account.statusReason === 'SUBSCRIPTION_EXPIRED' ? 'SUBSCRIPTION_EXPIRED' : 'TRIAL_EXPIRED', subEnd ?? trialEnd);
    case 'TRIAL':
      // Un essai sans date de fin est une anomalie : on ferme plutôt que d'offrir un essai illimité.
      if (trialEnd === null || t >= trialEnd) return closed('EXPIRED', 'TRIAL_EXPIRED', trialEnd, true);
      access = open('TRIAL', trialEnd);
      break;
    default:
      if (account.expiryEnforced !== false && subEnd !== null && t >= subEnd) return closed('EXPIRED', 'SUBSCRIPTION_EXPIRED', subEnd, true);
      access = open('ACTIVE', account.expiryEnforced === false ? null : subEnd);
  }

  if (opts.requireEmailVerification && !account.emailVerifiedAt && account.signupSource === 'self') {
    return { ...access, blocked: true, reason: 'EMAIL_NOT_VERIFIED' };
  }
  return access;
}

/**
 * Routes encore accessibles à un compte bloqué : se connecter, consulter son abonnement, déclarer un paiement,
 * écrire à l'administrateur. Tout le reste de l'ERP répond 402.
 */
export function isAllowedWhenBlocked(method: string, path: string): boolean {
  const segments = String(path || '').split('?')[0].replace(/^\/+/, '').split('/').filter(Boolean);
  const [first, second] = segments;
  if (first === 'auth' || first === 'billing' || first === 'public') return true;
  if (first === 'users' && method === 'GET' && (second === 'profile' || segments[2] === 'modules')) return true;
  return false;
}

/** Message affiché à la personne connectée quand son compte est bloqué. */
export function blockMessage(reason: BlockReason | null): string {
  switch (reason) {
    case 'TRIAL_EXPIRED': return 'Votre essai gratuit est terminé. Choisissez une formule pour continuer : vos données sont conservées.';
    case 'SUBSCRIPTION_EXPIRED': return 'Votre abonnement est arrivé à échéance. Renouvelez-le pour retrouver l’accès : vos données sont conservées.';
    case 'SUSPENDED': return 'Votre compte est suspendu. Contactez l’administrateur pour le réactiver : vos données sont conservées.';
    case 'CANCELLED': return 'Votre abonnement est résilié. Contactez l’administrateur pour le réactiver.';
    case 'EMAIL_NOT_VERIFIED': return 'Confirmez votre adresse email pour accéder à l’ERP (lien envoyé à l’inscription).';
    default: return 'Accès indisponible.';
  }
}

/** Configuration de modules (users.modules) à partir d'une liste de modules activés. Les modules de base restent actifs. */
export function modulesFromList(enabled: readonly string[]): Record<string, boolean> {
  const set = new Set(enabled);
  const out: Record<string, boolean> = {};
  for (const key of MODULE_KEYS) out[key] = CORE_MODULES.includes(key) || set.has(key);
  return out;
}
