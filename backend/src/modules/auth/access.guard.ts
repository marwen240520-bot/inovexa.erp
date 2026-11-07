import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService, RESOURCE_BY_PATH } from './permissions.service';

class PassportJwt extends AuthGuard('jwt') {}

const METHOD_ACTION: Record<string, string> = { GET: 'view', HEAD: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' };
/** Verbes d'URL qui remplacent l'action déduite de la méthode HTTP. */
const VERB_ACTION: Record<string, string> = { validate: 'validate', send: 'send', remind: 'send' };

/**
 * Garde GLOBAL : authentifie la requête quand un jeton est présent, puis applique les droits par ressource.
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

    const path = String(req.path || req.url || '').split('?')[0].replace(/^\/+/, '');
    const segments = path.split('/').filter(Boolean);
    const resource = RESOURCE_BY_PATH[segments[0]] ?? (segments[0] === 'hr' && segments[1] === 'payroll' ? 'payroll' : undefined);
    if (!resource) return true;

    const { role, permissions: extra, isTeamMember } = req.user;
    if (this.permissions.isOwnerLike(role, !!isTeamMember)) return true;

    let action = METHOD_ACTION[req.method] || 'view';
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
