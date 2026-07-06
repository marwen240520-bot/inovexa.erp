import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private readonly dummyHash;
    private attempts;
    private readonly MAX_ATTEMPTS;
    private readonly WINDOW_MS;
    private readonly BLOCK_MS;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    private guardRateLimit;
    private registerFailure;
    private resetAttempts;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: string;
            companyName: string;
            modules: Record<string, boolean>;
        };
    }>;
    createClientByAdmin(body: {
        email: string;
        password: string;
        name: string;
        companyName: string;
        phone?: string;
    }): Promise<{
        success: boolean;
        message: string;
        client: {
            id: number;
            email: string;
            name: string;
            companyName: string;
        };
    }>;
}
