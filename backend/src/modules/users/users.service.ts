import { assertStrongPassword } from '../auth/auth.service';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { normalizePhone } from '../../common/phone';

const MODULE_KEYS = [
  'dashboard', 'products', 'categories', 'stock', 'sales', 'purchases', 'orders', 'clients',
  'suppliers', 'invoices', 'hr', 'finance', 'logistics', 'ai', 'reports', 'analytics', 'profile', 'settings',
];

/**
 * Ce qu'une personne peut lire de son propre compte. Les secrets (mot de passe, clé de double authentification,
 * empreintes des liens envoyés par email, compteur de sessions) ne quittent jamais le serveur.
 */
export function publicProfile(user: User) {
  const {
    password: _password, twoFactorSecret: _twoFactorSecret, passwordResetHash: _passwordResetHash, passwordResetExpires: _passwordResetExpires,
    emailVerifyHash: _emailVerifyHash, emailVerifyExpires: _emailVerifyExpires, tokenVersion: _tokenVersion, googleSub,
    trialReminderStage: _trialReminderStage, renewalReminderStage: _renewalReminderStage,
    ...profile
  } = user;
  return { ...profile, googleLinked: !!googleSub };
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
    return publicProfile(user);
  }

  /**
   * Seuls trois champs sont modifiables ici : nom, téléphone, nom de la société. Le rôle, les modules, l'abonnement,
   * le rattachement à une société ou le mot de passe ne se changent JAMAIS par cette route. L'adresse email passe par
   * AuthService.changeEmail (mot de passe exigé, nouvelle adresse à confirmer) : voir UsersController.updateProfile.
   */
  async updateProfile(id: number, body: { name?: string; phone?: string; companyName?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const data = body && typeof body === 'object' ? body : {};

    if (data.name !== undefined) {
      const name = String(data.name ?? '').trim();
      if (name.length < 2 || name.length > 120) throw new BadRequestException('Nom invalide (2 à 120 caractères).');
      user.name = name;
    }
    if (data.phone !== undefined) {
      const raw = String(data.phone ?? '').trim();
      const check = normalizePhone(raw);
      user.phone = check.valid ? check.normalized : raw.slice(0, 40);
    }
    if (data.companyName !== undefined) user.companyName = String(data.companyName ?? '').trim().slice(0, 160);

    await this.userRepository.save(user);
    return publicProfile(user);
  }

  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isPasswordValid = await bcrypt.compare(String(oldPassword || ''), user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ancien mot de passe incorrect');
    }

    assertStrongPassword(newPassword, user.email);
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { success: true, message: 'Mot de passe changé avec succès' };
  }

  // Lit la configuration des modules depuis la colonne user.modules
  // (la même source que l'admin édite via /admin/clients/:id/modules)
  async getUserModules(id: number): Promise<Record<string, boolean>> {
    let user = await this.userRepository.findOne({ where: { id }, select: ['id', 'modules', 'ownerId'] });
    // Un membre d'équipe utilise les modules activés pour la société de son propriétaire
    if (user && user.ownerId) user = await this.userRepository.findOne({ where: { id: user.ownerId }, select: ['id', 'modules'] });
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
