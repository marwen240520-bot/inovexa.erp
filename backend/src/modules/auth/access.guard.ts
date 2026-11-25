import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService, RESOURCE_BY_PATH } from './permissions.service';
import { blockMessage, isAllowedWhenBlocked, isPlatformAdmin } from '../saas/account-access';

class PassportJwt extends AuthGuard('jwt') {}

const METHOD_ACTION: Record<string, string> = { GET: 'view', HEAD: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' };
/** Verbes d'URL qui remplacent l'action déduite de la méthode HTTP. */
const VERB_ACTION: Record<string, string> = { validate: 'validate', send: 'send', remind: 'send' };

/**
 * Modules de l'abonnement qui donnent le droit d'ÉCRIRE dans une ressource de l'API (premier segment de l'URL).
 * Un seul module actif de la liste suffit : la caisse écrit des ventes, les produits créent des catégories, etc.
 * Les lectures ne sont pas filtrées ici — le tableau de bord, les rapports et l'assistant lisent plusieurs modules.
 * Une ressource absente de la table n'est jamais bloquée (profil, société, équipe, abonnement…).
 */
export const MODULES_BY_WRITE_PATH: Record<string, string[]> = {
  products: ['products', 'stock', 'pos', 'sales', 'purchases'],
  categories: ['categories', 'products'],
  stock: ['stock', 'products'],
  sales: ['sales', 'pos'],
  purchases: ['purchases', 'pos'],
  pos: ['pos'],
  orders: ['orders'],
  clients: ['clients'], customers: ['clients'], crm: ['clients'],
  suppliers: ['suppliers'],
  invoices: ['invoices'], documents: ['invoices'],
  hr: ['hr'], employees: ['hr'], departments: ['hr'],
  finance: ['finance'], expenses: ['finance'], accounting: ['finance'],
  logistics: ['logistics'], transporteurs: ['logistics'],
  production: ['production'],
  objectives: ['objectives'],
  ia: ['ai'],
};

/** Même règle que la barre latérale : objectifs actifs sauf refus explicite ; caisse = ventes ou achats si non précisée. */
export function isModuleEnabled(modules: Record<string, boolean> | null | undefined, key: string): boolean {
  if (!modules || Object.keys(modules).length === 0) return true; // compte jamais configuré : tout est ouvert
  if (key === 'objectives') return modules.objectives !== false;
  if (key === 'pos' && modules.pos === undefined) return modules.sales === true || modules.purchases === true;
  return modules[key] === true;
}

/** Module manquant pour écrire dans `resourcePath`, ou null si l'écriture est permise. */
export function missingModuleFor(modules: Record<string, boolean> | null | undefined, resourcePath: string): string | null {
  const needed = MODULES_BY_WRITE_PATH[resourcePath];
  if (!needed) return null;
  return needed.some((key) => isModuleEnabled(modules, key)) ? null : needed[0];
}

/**
 * Garde GLOBAL : authentifie la requête quand un jeton est présent, puis applique dans l'ordre
 *  1. l'état du compte (essai terminé, abonnement échu, suspension) → 402, sauf pour les routes d'abonnement ;
 *  2. les modules de l'abonnement, pour les écritures → 403 ;
 *  3. les droits par rôle des membres d'équipe → 403.
 * Il ne remplace pas les gardes des contrôleurs : une route protégée sans jeton valide reste refusée (401) par JwtAuthGuard.
 * Les routes publiques (login…) restent publiques.
 */
@Injectable()
export class AccessGuard implements CanActivate {
  private readonly jwt = new PassportJwt();

  constructor(private readonly permissions: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest();
    if (req.method === 'OPTIONS') return true;
    if (!req.headers?.authorization) return true; // le garde du contrôleur répondra 401 si la route est protégée

    try {
      await (this.jwt.canActivate(context) as Promise<boolean>);
    } catch {
      return true; // jeton invalide ou expiré : laisse JwtAuthGuard produire la réponse 401
    }
    if (!req.user) return true;
    req.__jwtDone = true;

    // Express ne tient pas compte de la casse des URL (« /Products » atteint « /products ») : on compare en minuscules,
    // sinon une majuscule suffirait à sortir de la table des ressources protégées.
    const path = String(req.path || req.url || '').split('?')[0].replace(/^\/+/, '').toLowerCase();
    const segments = path.split('/').filter(Boolean);
    const method = String(req.method || 'GET').toUpperCase();
    const { role, permissions: extra, isTeamMember, account, modules } = req.user;

    // 1. Compte bloqué : seules les routes d'abonnement restent ouvertes. Les données ne sont ni modifiées ni supprimées.
    if (account?.blocked && !isAllowedWhenBlocked(method, path)) {
      throw new HttpException(
        { statusCode: 402, error: 'Payment Required', code: 'SUBSCRIPTION_REQUIRED', status: account.status, reason: account.reason, message: blockMessage(account.reason) },
        402,
      );
    }

    // 2. Modules de l'abonnement (écritures seulement).
    if (!isPlatformAdmin(role) && method !== 'GET' && method !== 'HEAD' && segments[0]) {
      const missing = missingModuleFor(modules, segments[0]);
      if (missing) {
        throw new ForbiddenException({ statusCode: 403, error: 'Forbidden', code: 'MODULE_DISABLED', module: missing, message: `Le module « ${missing} » n’est pas inclus dans votre abonnement.` });
      }
    }

    // 3. Droits par rôle (membres d'équipe).
    const resource = segments[0] === 'hr' && segments[1] === 'payroll' ? 'payroll' : RESOURCE_BY_PATH[segments[0]];
    if (!resource) return true;
    if (this.permissions.isOwnerLike(role, !!isTeamMember)) return true;

    let action = METHOD_ACTION[method] || 'view';
    for (const seg of segments.slice(1)) if (VERB_ACTION[seg]) action = VERB_ACTION[seg];
    // validate_stock : le magasinier valide les bons de livraison / réception (le détail par type est vérifié dans le service)
    const permission = `${resource}:${action}`;
    const ok =
      this.permissions.can(role, extra, permission, true) ||
      (action === 'validate' && this.permissions.can(role, extra, `${resource}:validate_stock`, true));
    if (!ok) throw new ForbiddenException(`Droit insuffisant (${permission}). Demandez l’accès au propriétaire du compte.`);
    return true;
  }
}
