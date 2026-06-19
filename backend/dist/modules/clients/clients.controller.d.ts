import { ClientsService } from './clients.service';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    findAll(req: any): Promise<import("./entities/client.entity").Client[]>;
    getStats(req: any): Promise<{
        total: number;
        active: number;
        inactive: number;
        totalSpent: number;
    }>;
    findOne(id: string, req: any): Promise<import("./entities/client.entity").Client>;
    create(req: any, body: any): Promise<import("./entities/client.entity").Client>;
    update(id: string, req: any, body: any): Promise<import("./entities/client.entity").Client>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/client.entity").Client>;
    importClients(req: any, body: {
        clients: any[];
    }): Promise<{
        success: number;
        errors: number;
        total: number;
    }>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
