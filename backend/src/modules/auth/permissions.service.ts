import { Injectable } from '@nestjs/common';

/**
 * Contrôle d'accès par rôle.
 *
 *  - `admin` / `super_admin` : opérateur de la plateforme (accès total, gère les comptes clients) ;
 *  - `client` : PROPRIÉTAIRE d'une société (compte créé par l'administrateur) — accès total à ses données ;
 *  - rôles d'équipe (`manager`, `sales`, `accountant`, `storekeeper`, `viewer`) : membres créés par le propriétaire
 *    (module Équipe), qui travaillent sur les données de la société avec des droits limités.
 *
 * Une permission s'écrit `ressource:action` — ex. `documents:validate`. Les actions de base sont déduites de la méthode HTTP :
 * GET -> view, POST -> create, PUT/PATCH -> edit, DELETE -> delete. Le propriétaire peut ajouter des droits à un membre
 * (`extraPermissions`) ou en retirer (`-ressource:action`).
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OWNER: 'client',
  MANAGER: 'manager',
  SALES: 'sales',
  ACCOUNTANT: 'accountant',
  STOREKEEPER: 'storekeeper',
  VIEWER: 'viewer',
  EMPLOYEE: 'employee',
  TRANSPORTEUR: 'transporteur',
} as const;

export const TEAM_ROLES = [ROLES.MANAGER, ROLES.SALES, ROLES.ACCOUNTANT, ROLES.STOREKEEPER, ROLES.VIEWER] as const;

/** Premier segment de l'URL -> ressource protégée. Absent de la table = accessible à tout utilisateur connecté. */
export const RESOURCE_BY_PATH: Record<string, string> = {
  products: 'products', categories: 'products',
  sales: 'sales', pos: 'pos',
  clients: 'clients', customers: 'clients', crm: 'clients',
  suppliers: 'suppliers',
  purchases: 'purchases',
  orders: 'orders',
  invoices: 'documents', documents: 'documents',
  stock: 'stock',
  accounting: 'accounting',
  finance: 'finance', expenses: 'finance',
  employees: 'hr', hr: 'hr', departments: 'hr',
  payroll: 'payroll',
  reports: 'reports', analytics: 'reports', dashboard: 'reports', export: 'reports',
  company: 'company',
  audit: 'audit',
  team: 'team',
  logistics: 'logistics', transporteur: 'logistics', transporteurs: 'logistics',
  production: 'production',
  projects: 'projects', objectives: 'projects',
};

const VIEW_ALL = ['products:view', 'sales:view', 'pos:view', 'clients:view', 'suppliers:view', 'purchases:view', 'orders:view', 'documents:view', 'stock:view',
  'logistics:view', 'production:view', 'projects:view', 'reports:view'];

const ROLE_GRANTS: Record<string, string[]> = {
  [ROLES.MANAGER]: ['*', '-team:*', '-audit:*', '-company:edit', '-company:create', '-company:delete'],
  [ROLES.SALES]: [
    'products:view', 'clients:*', 'sales:*', 'pos:*', 'orders:*', 'documents:view', 'documents:create', 'documents:edit', 'documents:validate', 'documents:send',
    'stock:view', 'reports:view', 'projects:view', 'logistics:view',
  ],
  [ROLES.ACCOUNTANT]: [
    'documents:*', 'accounting:*', 'finance:*', 'reports:*', 'payroll:*', 'hr:view', 'clients:view', 'suppliers:view', 'purchases:view', 'sales:view',
    'products:view', 'stock:view', 'company:view',
  ],
  [ROLES.STOREKEEPER]: [
    'products:view', 'products:edit', 'stock:*', 'purchases:view', 'purchases:create', 'suppliers:view', 'orders:view', 'logistics:*',
    'documents:view', 'documents:create', 'documents:edit', 'documents:validate_stock', 'clients:view',
  ],
  [ROLES.VIEWER]: [...VIEW_ALL],
  [ROLES.EMPLOYEE]: ['products:view', 'sales:view', 'clients:view'],
  [ROLES.TRANSPORTEUR]: ['products:view', 'sales:view', 'logistics:view'],
};

export const PERMISSIONS = {
  RESOURCES: Array.from(new Set(Object.values(RESOURCE_BY_PATH))),
  ACTIONS: ['view', 'create', 'edit', 'delete', 'validate', 'validate_stock', 'send'],
};

function matches(pattern: string, permission: string): boolean {
  if (pattern === '*') return true;
  if (pattern === permission) return true;
  if (pattern.endsWith(':*')) return permission.startsWith(pattern.slice(0, -1));
  return false;
}

@Injectable()
export class PermissionsService {
  isOwnerLike(role: string, isTeamMember: boolean): boolean {
    return !isTeamMember && (role === ROLES.OWNER || role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN);
  }

  getRolePermissions(role: string): string[] {
    return ROLE_GRANTS[role] || [];
  }

  /** Droits effectifs : ceux du rôle, plus/moins les ajustements du propriétaire. */
  effectivePermissions(role: string, extra?: string[] | null): string[] {
    return [...this.getRolePermissions(role), ...(extra || [])];
  }

  can(role: string, extra: string[] | null | undefined, permission: string, isTeamMember = true): boolean {
    if (this.isOwnerLike(role, isTeamMember)) return true;
    const list = this.effectivePermissions(role, extra);
    // Les retraits explicites (« -resource:action ») l'emportent toujours.
    if (list.some((p) => p.startsWith('-') && matches(p.slice(1), permission))) return false;
    return list.some((p) => !p.startsWith('-') && matches(p, permission));
  }

  /** Compatibilité : ancienne signature utilisée par PermissionsGuard. */
  hasPermission(userRole: string, userPermissions: string[], requiredPermission: string): boolean {
    return this.can(userRole, userPermissions, requiredPermission, true);
  }
}
