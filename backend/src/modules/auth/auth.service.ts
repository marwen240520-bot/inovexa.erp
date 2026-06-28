import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    
    const payload = { userId: user.id, email: user.email, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
        modules: user.modules
      }
    };
  }

  async createClientByAdmin(body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
  }) {
    const existingUser = await this.userRepository.findOne({ where: { email: body.email } });
    if (existingUser) {
      throw new ConflictException('Email déjà utilisé');
    }
    
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    const user = this.userRepository.create({
      email: body.email,
      password: hashedPassword,
      name: body.name,
      companyName: body.companyName,
      phone: body.phone || '',
      role: 'client',
      isActive: true
    });
    
    await this.userRepository.save(user);
    
    return {
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName
      }
    };
  }
}
