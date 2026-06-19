import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

// Définir un type simple pour le fichier uploadé
interface UploadedFileType {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  filename?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const { password, ...profile } = user;
    return profile;
  }

  async getUserStats(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    return {
      totalSales: 0,
      totalOrders: 0,
      totalClients: 0,
      memberSince: user.createdAt || new Date()
    };
  }

  async getUserTheme(id: number) {
    return { theme: 'dark' };
  }

  async updateUserTheme(id: number, theme: string) {
    return { success: true, theme };
  }

  async getUserModules(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    if (user.modules) {
      try {
        return JSON.parse(user.modules);
      } catch(e) {
        return {};
      }
    }
    return {
      dashboard: true, products: true, categories: true, stock: true,
      sales: true, purchases: true, orders: true, clients: true,
      suppliers: true, invoices: true, hr: true, finance: true,
      logistics: true, production: true, ai: true, reports: true,
      analytics: true, profile: true, settings: true
    };
  }

  async updateProfile(id: number, body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    Object.assign(user, body);
    await this.userRepository.save(user);
    
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfileImage(id: number, file: UploadedFileType) {
    return { success: true, message: 'Image de profil mise à jour', filename: file.filename || file.originalname };
  }

  async deleteProfileImage(id: number) {
    return { success: true, message: 'Image de profil supprimée' };
  }

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    // Vérifier que les paramètres sont fournis
    if (!oldPassword || !newPassword) {
      throw new UnauthorizedException('Ancien et nouveau mot de passe requis');
    }
    
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    // Vérifier que l'utilisateur a un mot de passe
    if (!user.password) {
      throw new UnauthorizedException('Aucun mot de passe défini pour cet utilisateur');
    }
    
    // Comparer l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await this.userRepository.save(user);
    
    return { success: true, message: 'Mot de passe changé avec succès' };
  }
}