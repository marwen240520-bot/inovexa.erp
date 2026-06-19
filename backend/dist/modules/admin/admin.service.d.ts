import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class AdminService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    private sanitizeDate;
    getAllClients(): Promise<User[]>;
    getClientById(id: number): Promise<User>;
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
            subscriptionEnd: string;
        };
    }>;
    updateClient(id: number, body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updateClientModules(id: number, modules: any): Promise<{
        success: boolean;
        message: string;
    }>;
    extendSubscription(id: number, days: number): Promise<{
        success: boolean;
        message: string;
        newEnd: string;
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
