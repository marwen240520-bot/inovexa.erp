"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = exports.PERMISSIONS = exports.ROLES = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
    CLIENT: 'client',
    TRANSPORTEUR: 'transporteur',
};
exports.PERMISSIONS = {
    PRODUCTS_VIEW: 'products:view',
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_EDIT: 'products:edit',
    PRODUCTS_DELETE: 'products:delete',
    SALES_VIEW: 'sales:view',
    SALES_CREATE: 'sales:create',
    SALES_EDIT: 'sales:edit',
    SALES_DELETE: 'sales:delete',
    CLIENTS_VIEW: 'clients:view',
    CLIENTS_CREATE: 'clients:create',
    CLIENTS_EDIT: 'clients:edit',
    CLIENTS_DELETE: 'clients:delete',
    USERS_VIEW: 'users:view',
    USERS_CREATE: 'users:create',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    REPORTS_VIEW: 'reports:view',
    REPORTS_EXPORT: 'reports:export',
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
};
const ROLE_PERMISSIONS = {
    [exports.ROLES.SUPER_ADMIN]: Object.values(exports.PERMISSIONS),
    [exports.ROLES.ADMIN]: Object.values(exports.PERMISSIONS),
    [exports.ROLES.MANAGER]: [
        exports.PERMISSIONS.PRODUCTS_VIEW, exports.PERMISSIONS.PRODUCTS_CREATE, exports.PERMISSIONS.PRODUCTS_EDIT,
        exports.PERMISSIONS.SALES_VIEW, exports.PERMISSIONS.SALES_CREATE, exports.PERMISSIONS.SALES_EDIT,
        exports.PERMISSIONS.CLIENTS_VIEW, exports.PERMISSIONS.CLIENTS_CREATE, exports.PERMISSIONS.CLIENTS_EDIT,
        exports.PERMISSIONS.REPORTS_VIEW, exports.PERMISSIONS.REPORTS_EXPORT,
    ],
    [exports.ROLES.EMPLOYEE]: [
        exports.PERMISSIONS.PRODUCTS_VIEW,
        exports.PERMISSIONS.SALES_VIEW,
        exports.PERMISSIONS.CLIENTS_VIEW,
    ],
    [exports.ROLES.CLIENT]: [
        exports.PERMISSIONS.PRODUCTS_VIEW,
        exports.PERMISSIONS.SALES_VIEW,
    ],
    [exports.ROLES.TRANSPORTEUR]: [
        exports.PERMISSIONS.PRODUCTS_VIEW,
        exports.PERMISSIONS.SALES_VIEW,
    ],
};
let PermissionsService = class PermissionsService {
    getRolePermissions(role) {
        return ROLE_PERMISSIONS[role] || [];
    }
    hasPermission(userRole, userPermissions, requiredPermission) {
        if (userRole === exports.ROLES.SUPER_ADMIN || userRole === exports.ROLES.ADMIN)
            return true;
        if (userPermissions?.includes(requiredPermission))
            return true;
        return this.getRolePermissions(userRole).includes(requiredPermission);
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)()
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map