export declare const ROLES: {
    SUPER_ADMIN: string;
    ADMIN: string;
    MANAGER: string;
    EMPLOYEE: string;
    CLIENT: string;
    TRANSPORTEUR: string;
};
export declare const PERMISSIONS: {
    PRODUCTS_VIEW: string;
    PRODUCTS_CREATE: string;
    PRODUCTS_EDIT: string;
    PRODUCTS_DELETE: string;
    SALES_VIEW: string;
    SALES_CREATE: string;
    SALES_EDIT: string;
    SALES_DELETE: string;
    CLIENTS_VIEW: string;
    CLIENTS_CREATE: string;
    CLIENTS_EDIT: string;
    CLIENTS_DELETE: string;
    USERS_VIEW: string;
    USERS_CREATE: string;
    USERS_EDIT: string;
    USERS_DELETE: string;
    REPORTS_VIEW: string;
    REPORTS_EXPORT: string;
    SETTINGS_VIEW: string;
    SETTINGS_EDIT: string;
};
export declare class PermissionsService {
    getRolePermissions(role: string): string[];
    hasPermission(userRole: string, userPermissions: string[], requiredPermission: string): boolean;
}
