import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class AdminService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getAllClients(): Promise<User[]>;
    getClientById(id: number): Promise<User>;
    getClientModules(id: number): Promise<Record<string, boolean>>;
    updateClientModules(id: number, modules: Record<string, boolean>): Promise<{
        success: boolean;
        message: string;
        modules: Record<string, boolean>;
    }>;
    createClient(body: {
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
    }>;
    updateClient(id: number, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    extendSubscription(id: number, days: number): Promise<{
        success: boolean;
        message: string;
        newEnd: Date;
    }>;
    deleteClient(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    toggleClientStatus(id: number): Promise<{
        success: boolean;
        isActive: boolean;
    }>;
    getAdminStats(): Promise<{
        totalClients: number;
        activeClients: number;
    }>;
}
