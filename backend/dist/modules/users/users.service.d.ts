import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
interface UploadedFileType {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    filename?: string;
}
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
    getUserStats(id: number): Promise<{
        totalSales: number;
        totalOrders: number;
        totalClients: number;
        memberSince: string | Date;
    }>;
    getUserTheme(id: number): Promise<{
        theme: string;
    }>;
    updateUserTheme(id: number, theme: string): Promise<{
        success: boolean;
        theme: string;
    }>;
    getUserModules(id: number): Promise<any>;
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
    updateProfileImage(id: number, file: UploadedFileType): Promise<{
        success: boolean;
        message: string;
        filename: string;
    }>;
    deleteProfileImage(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(id: number, oldPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
