import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      context.getHandler(),
    );
    
    if (!requiredPermissions) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) throw new ForbiddenException('Unauthorized');
    
    for (const permission of requiredPermissions) {
      if (!this.permissionsService.hasPermission(user.role, user.permissions, permission)) {
        throw new ForbiddenException(`Missing permission: ${permission}`);
      }
    }
    
    return true;
  }
}
