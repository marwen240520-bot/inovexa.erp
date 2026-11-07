import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Le garde global (AccessGuard) a déjà authentifié la requête : inutile de relire l'utilisateur en base.
    const req = context.switchToHttp().getRequest();
    if (req.user && req.__jwtDone) return true;
    return super.canActivate(context);
  }
}
