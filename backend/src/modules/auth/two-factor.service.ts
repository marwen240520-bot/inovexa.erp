import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { TwoFactorAuth } from './entities/two-factor.entity';

@Injectable()
export class TwoFactorService {
  constructor(
    @InjectRepository(TwoFactorAuth)
    private twoFactorRepository: Repository<TwoFactorAuth>,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({ name: 'Inovexa-AI' });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    await this.twoFactorRepository.upsert(
      { user_id: userId, secret: secret.base32, enabled: false },
      ['user_id'],
    );

    return { secret: secret.base32 || '', qrCode };
  }

  async enable2FA(userId: string, token: string): Promise<{ message: string }> {
    const record = await this.twoFactorRepository.findOne({ where: { user_id: userId } });
    if (!record || !record.secret) {
      throw new BadRequestException('2FA non configuré');
    }

    const verified = speakeasy.totp.verify({
      secret: record.secret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new BadRequestException('Code invalide');
    }

    await this.twoFactorRepository.update({ user_id: userId }, { enabled: true });
    return { message: '2FA activé avec succès' };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const record = await this.twoFactorRepository.findOne({ where: { user_id: userId } });
    if (!record || !record.enabled) return true;

    return speakeasy.totp.verify({
      secret: record.secret,
      encoding: 'base32',
      token,
    });
  }

  async disable2FA(userId: string, token: string): Promise<{ message: string }> {
    const verified = await this.verifyToken(userId, token);
    if (!verified) {
      throw new BadRequestException('Code invalide');
    }
    await this.twoFactorRepository.delete({ user_id: userId });
    return { message: '2FA désactivé avec succès' };
  }

  async getStatus(userId: string): Promise<{ enabled: boolean }> {
    const record = await this.twoFactorRepository.findOne({ where: { user_id: userId } });
    return { enabled: record?.enabled || false };
  }
}
