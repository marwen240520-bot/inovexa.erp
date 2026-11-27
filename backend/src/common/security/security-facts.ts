import type { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { allowedOrigins, apiPublicUrl, isPublicHttps } from '../origins';
import { isSynchronizeEnabled } from '../../database/typeorm.config';
import { MailService } from '../mail/mail.service';
import { PaymentGatewayService } from '../../modules/saas/payment-gateway.service';
import { User } from '../../modules/users/entities/user.entity';
import type { SecurityFacts } from './security-report';

export interface SecurityDeps {
  mail: Pick<MailService, 'isConfigured'>;
  gateway: Pick<PaymentGatewayService, 'isConfigured' | 'info'>;
  users: Pick<Repository<User>, 'count'>;
}

/** Relève l'état réel du serveur pour le rapport de sécurité. Ne lit que des indications : aucune valeur secrète n'en sort. */
export async function buildSecurityFacts({ mail, gateway, users }: SecurityDeps): Promise<SecurityFacts> {
  const secret = (process.env.JWT_SECRET || '').trim();
  let adminsWithoutTwoFactor: number | null = null;
  try {
    adminsWithoutTwoFactor = await users.count({ where: { role: In(['admin', 'super_admin']), isActive: true, twoFactorEnabled: false } });
  } catch {
    adminsWithoutTwoFactor = null;
  }
  return {
    production: process.env.NODE_ENV === 'production',
    jwtSecretLength: secret.length,
    jwtSecretDistinct: new Set(secret).size,
    apiUrl: apiPublicUrl(),
    siteUrls: allowedOrigins().filter(isPublicHttps),
    synchronize: isSynchronizeEnabled(),
    swagger: process.env.ENABLE_SWAGGER === 'true',
    mailConfigured: mail.isConfigured(),
    gateway: { provider: gateway.info().provider, configured: gateway.isConfigured(), mode: gateway.info().mode },
    backups: !!(process.env.BACKUP_PASSPHRASE && process.env.BACKUP_S3_URI),
    adminsWithoutTwoFactor,
  };
}

/** Au démarrage : les mêmes relevés, en allant chercher les services dans l'application. */
export function collectSecurityFacts(app: INestApplication): Promise<SecurityFacts> {
  return buildSecurityFacts({
    mail: app.get(MailService, { strict: false }),
    gateway: app.get(PaymentGatewayService, { strict: false }),
    users: app.get<Repository<User>>(getRepositoryToken(User), { strict: false }),
  });
}
