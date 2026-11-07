import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { MailService } from '../../common/mail/mail.service';
import { AuditService } from '../../common/audit/audit.service';
import { generateSecret, otpauthUrl, verifyTotp } from '../../common/totp';
import { PermissionsService } from './permissions.service';

/** 8 caractères minimum, au moins une lettre et un chiffre. */
export function assertStrongPassword(password: string) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new BadRequestException('Mot de passe trop faible : 8 caractères minimum, avec au moins une lettre et un chiffre.');
  }
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class AuthService {
  // Hash factice : un bcrypt.compare est toujours exécuté -> temps de réponse
  // constant, ce qui empêche l'énumération des comptes par mesure du temps.
  private readonly dummyHash = bcrypt.hashSync('inovexa-dummy-password-x9f3', 10);

  // Limiteur de tentatives en mémoire, par email.
  private attempts = new Map<string, { count: number; resetAt: number; blockedUntil: number }>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000;
  private readonly BLOCK_MS = 15 * 60 * 1000;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mail: MailService,
    private audit: AuditService,
    private permissions: PermissionsService,
  ) {}

  private guardRateLimit(key: string) {
    const now = Date.now();
    const rec = this.attempts.get(key);
    if (rec && rec.blockedUntil > now) {
      const mins = Math.ceil((rec.blockedUntil - now) / 60000);
      throw new HttpException(
        `Trop de tentatives. Réessayez dans ${mins} min.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private registerFailure(key: string) {
    const now = Date.now();
    let rec = this.attempts.get(key);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + this.WINDOW_MS, blockedUntil: 0 };
    }
    rec.count += 1;
    if (rec.count >= this.MAX_ATTEMPTS) {
      rec.blockedUntil = now + this.BLOCK_MS;
    }
    this.attempts.set(key, rec);
  }

  private resetAttempts(key: string) {
    this.attempts.delete(key);
  }

  async login(email: string, password: string, otp?: string, ip?: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    this.guardRateLimit(normalizedEmail);

    // Recherche insensible à la casse, sans casser les emails déjà enregistrés.
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email: normalizedEmail })
      .getOne();

    // Toujours comparer un hash (réel ou factice) -> temps de réponse constant.
    const passwordValid = await bcrypt.compare(
      password || '',
      user ? user.password : this.dummyHash,
    );

    if (!user || !passwordValid) {
      this.registerFailure(normalizedEmail);
      void this.audit.record({ userId: user?.ownerId ?? user?.id ?? null, actorId: user?.id ?? null, actorEmail: normalizedEmail, action: 'login_failed', entity: 'auth', ip: ip || null, status: 401 });
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Le statut « désactivé » n'est révélé qu'avec des identifiants valides
    // (pas d'énumération des comptes via ce message).
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    // Double authentification (TOTP)
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!otp) {
        throw new UnauthorizedException({ statusCode: 401, message: 'Code de vérification requis', error: 'Unauthorized', requires2fa: true });
      }
      if (!verifyTotp(user.twoFactorSecret, otp)) {
        this.registerFailure(normalizedEmail);
        void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'login_2fa_failed', entity: 'auth', ip: ip || null, status: 401 });
        throw new UnauthorizedException({ statusCode: 401, message: 'Code de vérification invalide', error: 'Unauthorized', requires2fa: true });
      }
    }

    // Un membre d'équipe dont la société est désactivée ne peut pas se connecter
    let owner: User | null = null;
    if (user.ownerId) {
      owner = await this.userRepository.findOne({ where: { id: user.ownerId } });
      if (!owner || !owner.isActive) throw new UnauthorizedException('Le compte de la société est désactivé');
    }

    this.resetAttempts(normalizedEmail);
    await this.userRepository.update({ id: user.id }, { lastLoginAt: new Date() });
    const payload = { userId: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 };
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'login', entity: 'auth', ip: ip || null, status: 200 });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: owner ? owner.companyName : user.companyName,
        // Un membre d'équipe voit les modules activés pour sa société
        modules: owner ? owner.modules : user.modules,
        isTeamMember: !!user.ownerId,
        ownerId: user.ownerId ?? null,
        twoFactorEnabled: !!user.twoFactorEnabled,
        permissions: user.ownerId ? this.permissions.effectivePermissions(user.role, user.extraPermissions) : ['*'],
      },
    };
  }

  /** Profil de la personne connectée, avec ses droits (pour griser l'interface). */
  async me(actorId: number) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    const owner = user.ownerId ? await this.userRepository.findOne({ where: { id: user.ownerId } }) : null;
    return {
      id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone,
      companyName: owner ? owner.companyName : user.companyName, modules: owner ? owner.modules : user.modules,
      isTeamMember: !!user.ownerId, twoFactorEnabled: !!user.twoFactorEnabled, lastLoginAt: user.lastLoginAt,
      permissions: user.ownerId ? this.permissions.effectivePermissions(user.role, user.extraPermissions) : ['*'],
    };
  }

  // ───────────── Mot de passe oublié ─────────────

  /** Répond toujours de la même façon : on ne révèle pas si l'email existe. */
  async forgotPassword(email: string) {
    const generic = { success: true, message: 'Si ce compte existe, un email de réinitialisation vient d’être envoyé.' };
    const normalized = (email || '').trim().toLowerCase();
    this.guardRateLimit(`reset:${normalized}`);
    this.registerFailure(`reset:${normalized}`); // 5 demandes / 15 min / email
    const user = await this.userRepository.createQueryBuilder('u').where('LOWER(u.email) = :e', { e: normalized }).getOne();
    if (!user || !user.isActive) return generic;

    const token = randomBytes(32).toString('hex');
    user.passwordResetHash = sha256(token);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepository.save(user);

    const base = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const link = `${base}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    const sent = await this.mail.trySend({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe Inovexa ERP',
      text: `Bonjour ${user.name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.`,
      html: `<p>Bonjour ${escapeHtml(user.name)},</p><p>Pour choisir un nouveau mot de passe, cliquez sur le lien ci-dessous (valable 1 heure) :</p><p><a href="${link}">Réinitialiser mon mot de passe</a></p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe actuel reste valable.</p>`,
    });
    if (!sent) console.warn(`[auth] Email SMTP non configuré : lien de réinitialisation pour ${user.email} -> ${link}`);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'password_reset_requested', entity: 'auth' });
    return generic;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    assertStrongPassword(newPassword);
    const normalized = (email || '').trim().toLowerCase();
    this.guardRateLimit(`resetpw:${normalized}`);
    const user = await this.userRepository.createQueryBuilder('u').where('LOWER(u.email) = :e', { e: normalized }).getOne();
    const ok = !!user && !!user.passwordResetHash && !!user.passwordResetExpires && user.passwordResetExpires.getTime() > Date.now() && user.passwordResetHash === sha256(String(token || ''));
    if (!ok) {
      this.registerFailure(`resetpw:${normalized}`);
      throw new BadRequestException('Lien invalide ou expiré. Refaites une demande de réinitialisation.');
    }
    user!.password = await bcrypt.hash(newPassword, 10);
    user!.passwordResetHash = null;
    user!.passwordResetExpires = null;
    user!.tokenVersion = (user!.tokenVersion ?? 0) + 1; // déconnecte toutes les sessions ouvertes
    await this.userRepository.save(user!);
    void this.audit.record({ userId: user!.ownerId ?? user!.id, actorId: user!.id, actorEmail: user!.email, action: 'password_reset', entity: 'auth' });
    return { success: true, message: 'Mot de passe modifié. Vous pouvez vous connecter.' };
  }

  /** Révoque toutes les sessions de la personne connectée (« se déconnecter partout »). */
  async logoutEverywhere(actorId: number) {
    await this.userRepository.increment({ id: actorId }, 'tokenVersion', 1);
    return { success: true };
  }

  // ───────────── Double authentification ─────────────

  async twoFactorSetup(actorId: number) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    if (user.twoFactorEnabled) throw new BadRequestException('La double authentification est déjà activée.');
    user.twoFactorSecret = generateSecret();
    await this.userRepository.save(user);
    const url = otpauthUrl(user.twoFactorSecret, user.email);
    return { secret: user.twoFactorSecret, otpauthUrl: url, qrCodeDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 220 }) };
  }

  async twoFactorEnable(actorId: number, code: string) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user || !user.twoFactorSecret) throw new BadRequestException('Lancez d’abord la configuration (/auth/2fa/setup).');
    if (!verifyTotp(user.twoFactorSecret, code)) throw new BadRequestException('Code invalide. Vérifiez l’heure de votre téléphone.');
    user.twoFactorEnabled = true;
    await this.userRepository.save(user);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: '2fa_enabled', entity: 'auth' });
    return { success: true, twoFactorEnabled: true };
  }

  async twoFactorDisable(actorId: number, password: string, code: string) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    if (!(await bcrypt.compare(password || '', user.password))) throw new UnauthorizedException('Mot de passe incorrect');
    if (user.twoFactorEnabled && !(user.twoFactorSecret && verifyTotp(user.twoFactorSecret, code))) throw new BadRequestException('Code invalide.');
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await this.userRepository.save(user);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: '2fa_disabled', entity: 'auth' });
    return { success: true, twoFactorEnabled: false };
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

function escapeHtml(s: string) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
