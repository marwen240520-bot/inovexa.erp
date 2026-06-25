import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    }>;
    updateAvatar(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    }>;
    deleteAvatar(req: any): Promise<{
        success: boolean;
    }>;
    getAvatar(req: any): Promise<{
        success: boolean;
        avatar: string;
        url: string;
    } | {
        success: boolean;
        avatar: any;
        url?: undefined;
    }>;
}
