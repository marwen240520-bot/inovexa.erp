import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const MODULE_KEYS = [
  'dashboard', 'products', 'categories', 'stock', 'sales', 'purchases', 'orders', 'clients',
  'suppliers', 'invoices', 'hr', 'finance', 'logistics', 'production', 'ai', 'reports', 'analytics', 'profile', 'settings',
];

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

  async updateProfile(id: number, body: { name?: string; email?: string; phone?: string; companyName?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    Object.assign(user, body);
    await this.userRepository.save(user);
    
    const { password, ...profile } = user;
    return profile;
  }

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }
    
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    
    return { success: true, message: 'Mot de passe changé avec succès' };
  }

  // Lit la configuration des modules depuis la colonne user.modules
  // (la même source que l'admin édite via /admin/clients/:id/modules)
  async getUserModules(id: number): Promise<Record<string, boolean>> {
    const user = await this.userRepository.findOne({ where: { id }, select: ['id', 'modules'] });
    const stored = (user && user.modules) || {};
    // Client jamais configuré : tous les modules actifs par défaut
    if (Object.keys(stored).length === 0) {
      const all: Record<string, boolean> = {};
      MODULE_KEYS.forEach((k) => { all[k] = true; });
      return all;
    }
    // Client configuré : on renvoie la config de l'admin ; modules cœur toujours actifs
    const result: Record<string, boolean> = { ...stored };
    result.dashboard = true;
    result.profile = true;
    result.settings = true;
    return result;
  }
}
