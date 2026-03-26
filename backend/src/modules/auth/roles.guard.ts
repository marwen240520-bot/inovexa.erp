import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('Non authentifié');
    }
    
    // Admin a accès à tout
    if (user.role === 'admin') {
      return true;
    }
    
    // Client a accès à toutes les fonctionnalités sauf gestion des clients
    if (user.role === 'user') {
      // Interdire l'accès aux routes clients (admin uniquement)
      const forbiddenRoutes = ['clients', 'users', 'employees', 'leaves', 'audit_logs'];
      const route = request.url.split('/')[1];
      
      if (forbiddenRoutes.includes(route)) {
        throw new ForbiddenException('Accès non autorisé');
      }
      return true;
    }
    
    return requiredRoles.some((role) => user?.role === role);
  }
}
