import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class UploadService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    saveAvatar(userId: number, file: Express.Multer.File): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    }>;
    updateAvatar(userId: number, file: Express.Multer.File): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    }>;
    deleteAvatar(userId: number): Promise<{
        success: boolean;
    }>;
    getAvatar(userId: number): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    } | {
        success: boolean;
        avatar: any;
        url?: undefined;
    }>;
}
