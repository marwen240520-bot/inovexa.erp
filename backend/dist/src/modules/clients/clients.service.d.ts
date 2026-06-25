import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
export declare class ClientsService {
    private clientRepository;
    constructor(clientRepository: Repository<Client>);
    findAll(userId: number): Promise<Client[]>;
    findOne(id: number, userId: number): Promise<Client>;
    create(userId: number, data: Partial<Client>): Promise<Client>;
    update(id: number, userId: number, data: Partial<Client>): Promise<Client>;
    updateStatus(id: number, userId: number, status: string): Promise<Client>;
    importClients(userId: number, clients: any[]): Promise<{
        success: number;
        errors: number;
        total: number;
    }>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        active: number;
        inactive: number;
        totalSpent: number;
    }>;
}
