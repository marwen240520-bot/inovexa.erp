import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: string;
            companyName: string;
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
