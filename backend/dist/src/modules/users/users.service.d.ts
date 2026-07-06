import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getProfile(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        companyName: string;
        phone: string;
        role: string;
        avatar: string;
        modules: Record<string, boolean>;
        subscriptionStart: Date;
        subscriptionEnd: Date;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(id: number, body: {
        name?: string;
        email?: string;
        phone?: string;
        companyName?: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        companyName: string;
        phone: string;
        role: string;
        avatar: string;
        modules: Record<string, boolean>;
        subscriptionStart: Date;
        subscriptionEnd: Date;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(id: number, oldPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserModules(id: number): Promise<Record<string, boolean>>;
}
