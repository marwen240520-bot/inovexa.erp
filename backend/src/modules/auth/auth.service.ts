import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await user.comparePassword(password))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.is_verified,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    await this.userRepository.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires,
    });

    console.log('Reset link: http://localhost:3000/auth/reset-password?token=' + resetToken);

    return { message: 'Email de réinitialisation envoyé' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { reset_token: token },
    });

    if (!user || user.reset_token_expires < new Date()) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    user.password_hash = newPassword;
    user.reset_token = '';
    user.reset_token_expires = new Date();
    await this.userRepository.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepository.update(user.id, { verification_token: verificationToken });

    console.log('Verify link: http://localhost:3000/auth/verify-email?token=' + verificationToken);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { verification_token: token } });
    if (!user) {
      throw new BadRequestException('Token invalide');
    }

    await this.userRepository.update(user.id, { is_verified: true, verification_token: '' });
    return { message: 'Email vérifié avec succès' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Utilisateur non trouvé');

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) throw new UnauthorizedException('Mot de passe actuel incorrect');

    user.password_hash = newPassword;
    await this.userRepository.save(user);

    return { message: 'Mot de passe modifié avec succès' };
  }
}
