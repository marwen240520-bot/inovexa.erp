import { UsersService } from './users.service';
interface UploadedFileType {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    filename?: string;
}
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
        subscriptionStart: string;
        subscriptionEnd: string;
        isActive: boolean;
        modules: string;
        theme: string;
        profileImage: string;
        hireDate: string;
        createdAt: string;
        updatedAt: string;
    }>;
    getUserStats(req: any): Promise<{
        totalSales: number;
        totalOrders: number;
        totalClients: number;
        memberSince: string | Date;
    }>;
    getUserTheme(req: any): Promise<{
        theme: string;
    }>;
    updateUserTheme(req: any, body: {
        theme: string;
    }): Promise<{
        success: boolean;
        theme: string;
    }>;
    getUserModules(id: string, req: any): Promise<any>;
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
        subscriptionStart: string;
        subscriptionEnd: string;
        isActive: boolean;
        modules: string;
        theme: string;
        profileImage: string;
        hireDate: string;
        createdAt: string;
        updatedAt: string;
    }>;
    updateProfileImage(req: any, file: UploadedFileType): Promise<{
        success: boolean;
        message: string;
        filename: string;
    }>;
    deleteProfileImage(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
