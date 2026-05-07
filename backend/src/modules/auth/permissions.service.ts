import { Injectable } from '@nestjs/common';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
  TRANSPORTEUR: 'transporteur',
};

export const PERMISSIONS = {
  // Produits
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  
  // Ventes
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_EDIT: 'sales:edit',
  SALES_DELETE: 'sales:delete',
  
  // Clients
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_EDIT: 'clients:edit',
  CLIENTS_DELETE: 'clients:delete',
  
  // Utilisateurs
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  
  // Rapports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  
  // Paramètres
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.SALES_EDIT,
    PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_CREATE, PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.CLIENTS_VIEW,
  ],
  [ROLES.CLIENT]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
  ],
  [ROLES.TRANSPORTEUR]: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
  ],
};

@Injectable()
export class PermissionsService {
  getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  hasPermission(userRole: string, userPermissions: string[], requiredPermission: string): boolean {
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) return true;
    if (userPermissions?.includes(requiredPermission)) return true;
    return this.getRolePermissions(userRole).includes(requiredPermission);
  }
}
