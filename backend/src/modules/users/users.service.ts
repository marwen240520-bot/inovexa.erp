import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const DEFAULT_MODULES = {
  dashboard: true, products: true, categories: true, stock: true,
  sales: true, purchases: true, orders: true, clients: true,
  suppliers: true, invoices: true, hr: true, finance: true,
  logistics: true, production: true, ai: true, reports: true,
  analytics: true, profile: true, settings: true
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    // ⭐ S'assurer que profileImage est inclus
    const { password, ...profile } = user;
    console.log('📸 Profile image URL:', profile.profileImage); // Debug
    return profile;
  }

  async getUserModules(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    if (user.modules) {
      return JSON.parse(user.modules);
    }
    return DEFAULT_MODULES;
  }

  async updateProfile(id: number, body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    Object.assign(user, body);
    await this.userRepository.save(user);
    
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfileImage(id: number, imageUrl: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    user.profileImage = imageUrl;
    await this.userRepository.save(user);
    
    console.log('✅ Image sauvegardée pour user:', id, 'URL:', imageUrl);
    
    // ⭐ Retourner l'utilisateur complet avec l'image
    const { password, ...profile } = user;
    return profile;
  }

  async changePassword(id: number, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    
    return { success: true, message: 'Mot de passe changé avec succès' };
  }
}