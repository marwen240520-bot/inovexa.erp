import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getAllClients(req: any): Promise<import("../users/entities/user.entity").User[] | {
        error: string;
    }>;
    getClientById(id: string, req: any): Promise<import("../users/entities/user.entity").User | {
        error: string;
    }>;
    getClientModules(id: string, req: any): Promise<Record<string, boolean> | {
        error: string;
    }>;
    updateClientModules(id: string, req: any, body: {
        modules: Record<string, boolean>;
    }): Promise<{
        success: boolean;
        message: string;
        modules: Record<string, boolean>;
    } | {
        error: string;
    }>;
    createClient(req: any, body: {
        email: string;
        password: string;
        name: string;
        companyName: string;
        phone?: string;
        subscriptionDuration: number;
    }): Promise<{
        success: boolean;
        message: string;
        client: {
            id: number;
            email: string;
            name: string;
            companyName: string;
            subscriptionEnd: Date;
            modules: Record<string, boolean>;
        };
    } | {
        error: string;
    }>;
    updateClient(id: string, req: any, body: {
        name?: string;
        companyName?: string;
        phone?: string;
        subscriptionEnd?: Date;
        isActive?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
    } | {
        error: string;
    }>;
    extendSubscription(id: string, req: any, body: {
        days: number;
    }): Promise<{
        success: boolean;
        message: string;
        newEnd: Date;
    } | {
        error: string;
    }>;
    deleteClient(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    } | {
        error: string;
    }>;
    toggleClientStatus(id: string, req: any): Promise<{
        success: boolean;
        isActive: boolean;
    } | {
        error: string;
    }>;
    getAdminStats(req: any): Promise<{
        totalClients: number;
        activeClients: number;
    } | {
        error: string;
    }>;
}
