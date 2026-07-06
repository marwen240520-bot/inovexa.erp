import { ClientsService } from './clients.service';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    findAll(req: any): Promise<{
        totalSpent: number;
        id: number;
        userId: number;
        name: string;
        email: string;
        phone: string;
        address: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string, req: any): Promise<import("./entities/client.entity").Client>;
    create(req: any, body: any): Promise<import("./entities/client.entity").Client>;
    update(id: string, req: any, body: any): Promise<import("./entities/client.entity").Client>;
    updateStatus(id: string, req: any, body: {
        status: string;
    }): Promise<import("./entities/client.entity").Client>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
