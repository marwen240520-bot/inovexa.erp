import { ClientModulesService } from './client-modules.service';
export declare class ClientModulesController {
    private readonly clientModulesService;
    constructor(clientModulesService: ClientModulesService);
    getMyModules(req: any): Promise<import("./entities/client-modules.entity").ClientModules>;
    getClientModules(clientId: string, req: any): Promise<import("./entities/client-modules.entity").ClientModules | {
        error: string;
    }>;
    updateClientModules(clientId: string, req: any, body: any): Promise<{
        error: string;
        success?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        data: import("./entities/client-modules.entity").ClientModules;
        error?: undefined;
    }>;
    resetClientModules(clientId: string, req: any): Promise<import("./entities/client-modules.entity").ClientModules | {
        error: string;
    }>;
    getAllConfig(req: any): Promise<import("./entities/client-modules.entity").ClientModules[] | {
        error: string;
    }>;
    checkModule(module: string, req: any): Promise<any>;
}
