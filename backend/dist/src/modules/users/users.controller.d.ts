import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: {
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
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
