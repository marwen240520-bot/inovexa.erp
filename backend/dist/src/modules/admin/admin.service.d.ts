import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class AdminService {
    private userRepository;
    private dataSource;
    constructor(userRepository: Repository<User>, dataSource: DataSource);
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
        seedDemoData?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        demoData: {
            seeded: boolean;
            perModule: number;
            min: number;
            max: number;
            total: number;
            error?: string;
        };
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
    private purgeClientData;
    private describeDbError;
    deleteClient(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    resetDemoData(id: number): Promise<{
        success: boolean;
        message: string;
        demoData: {
            seeded: boolean;
            perModule: number;
            min: number;
            max: number;
            total: number;
        };
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
