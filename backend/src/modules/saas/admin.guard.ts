import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { isPlatformAdmin } from './account-access';

/**
 * Réserve une route à l'administrateur de la PLATFORME (rôle admin ou super_admin, jamais un membre d'équipe).
 * À placer après JwtAuthGuard : `@UseGuards(JwtAuthGuard, AdminGuard)`. Répond 403 — et non 200 avec { error } —
 * pour que le refus soit visible du navigateur comme du journal d'audit.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    if (!user || user.isTeamMember || !isPlatformAdmin(user.role)) {
      throw new ForbiddenException('Accès réservé à l’administrateur de la plateforme.');
    }
    return true;
  }
}

/**
 * Retire d'un corps de requête les champs qu'un client ne doit jamais fixer lui-même : l'identité de la ligne (`id`) et
 * son rattachement à une société (`userId`, `ownerId`). Sans cela, « créer » avec l'id d'une ligne existante écraserait
 * la ligne d'une autre société, et « modifier » avec un autre userId la ferait changer de société.
 * `extra` : autres champs à protéger pour une route donnée (dates techniques, totaux calculés par le serveur…).
 */
export function stripProtected<T extends Record<string, any>>(body: T, extra: string[] = []): T {
  const out: Record<string, any> = { ...(body && typeof body === 'object' ? body : {}) };
  for (const key of ['id', 'userId', 'ownerId', ...extra]) delete out[key];
  return out as T;
}
