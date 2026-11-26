import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus, BadRequestException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
import { SaasSettingsService } from '../saas/saas-settings.service';
import { SubscriptionService } from '../saas/subscription.service';
import { isPlatformAdmin } from '../saas/account-access';
import { Sector } from '../saas/entities/sector.entity';
import { CompanyService } from '../company/company.service';
import { validateTaxId } from '../../common/fiscal';
import { normalizePhone } from '../../common/phone';
import { verifyGoogleIdToken } from './google-verifier';
import { verifyAppleIdToken } from './apple-verifier';
import type { AppleAuthDto, GoogleAuthDto, RegisterDto } from './dto/register.dto';

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
    private settings: SaasSettingsService,
    private subscriptions: SubscriptionService,
    private company: CompanyService,
  ) {}

  private frontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  }

  private findByEmail(email: string) {
    return this.userRepository.createQueryBuilder('u').where('LOWER(u.email) = :email', { email: email.trim().toLowerCase() }).getOne();
  }

  /**
   * Réponse commune à toutes les connexions (mot de passe, Google, inscription) : jeton + profil + état du compte.
   * `account` est calculé par le serveur ; un compte bloqué reçoit quand même un jeton, pour pouvoir consulter son
   * abonnement et déclarer un paiement — toutes les autres routes lui répondent 402.
   */
  private async session(user: User, owner: User | null) {
    const settings = await this.settings.get();
    const accountRow = owner ?? user;
    const payload = { userId: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 };
    const hasAccount = !isPlatformAdmin(user.role) && accountRow.role === 'client';
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
        sector: accountRow.sector ?? null,
      },
      account: hasAccount ? this.subscriptions.view(accountRow, settings) : null,
    };
  }

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
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'login', entity: 'auth', ip: ip || null, status: 200 });

    return this.session(user, owner);
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
      sector: (owner ?? user).sector ?? null, googleLinked: !!user.googleSub, appleLinked: !!user.appleSub,
      emailVerified: !!user.emailVerifiedAt || user.signupSource !== 'self',
      // État du compte calculé par le serveur (essai, abonnement, suspension) : l'interface ne fait que l'afficher.
      account: !isPlatformAdmin(user.role) && (owner ?? user).role === 'client' ? this.subscriptions.view(owner ?? user, await this.settings.get()) : null,
    };
  }

  // ───────────── Inscription d'une société (essai gratuit) ─────────────

  /** Vérifie les champs facultatifs AVANT de créer le compte : une inscription ne doit pas rester à moitié faite. */
  private async checkSignup(sectorCode: string, phone?: string, taxId?: string) {
    const sector = await this.userRepository.manager.getRepository(Sector).findOne({ where: { code: String(sectorCode || '').toLowerCase(), isActive: true } });
    if (!sector) throw new BadRequestException('Choisissez votre secteur d’activité dans la liste.');
    const phoneCheck = normalizePhone(phone);
    if (!phoneCheck.valid) throw new BadRequestException(phoneCheck.message);
    const tax = validateTaxId(taxId);
    if (!tax.valid) throw new BadRequestException(tax.message);
    return { sector, phone: phoneCheck.normalized || null, taxId: tax.normalized || null };
  }

  /**
   * Crée le compte PROPRIÉTAIRE d'une nouvelle société. Le rôle est toujours « client » : aucun champ de la requête
   * ne peut créer un administrateur. L'essai démarre ici, pour la durée fixée dans les réglages de la plateforme.
   */
  private async createOwner(input: {
    email: string; name: string; companyName: string; phone: string | null; passwordHash: string; sectorCode: string;
    source: 'self' | 'google' | 'apple'; googleSub?: string | null; appleSub?: string | null; emailVerified: boolean; verifyHash?: string | null;
  }): Promise<User> {
    const now = new Date();
    const trial = await this.subscriptions.trialDates(now);
    const user = this.userRepository.create({
      email: input.email, password: input.passwordHash, name: input.name, companyName: input.companyName, phone: input.phone,
      role: 'client', isActive: true, ownerId: null,
      modules: await this.subscriptions.sectorModules(input.sectorCode), sector: input.sectorCode,
      accountStatus: 'TRIAL', trialStartedAt: trial.trialStartedAt, trialEndsAt: trial.trialEndsAt, expiryEnforced: true, statusChangedAt: now,
      signupSource: input.source, googleSub: input.googleSub ?? null, appleSub: input.appleSub ?? null,
      emailVerifiedAt: input.emailVerified ? now : null,
      emailVerifyHash: input.verifyHash ?? null, emailVerifyExpires: input.verifyHash ? new Date(now.getTime() + 48 * 3600_000) : null,
      lastLoginAt: now,
    } as Partial<User>) as User;
    try {
      return await this.userRepository.save(user);
    } catch (e: any) {
      if (e?.code === '23505' || e?.driverError?.code === '23505') throw new ConflictException('Un compte existe déjà avec cet email. Connectez-vous, ou réinitialisez votre mot de passe.');
      throw e;
    }
  }

  private async afterSignup(user: User, extra: { city?: string; address?: string; legalForm?: string; taxId?: string | null }, ip?: string) {
    // Fiche société créée tout de suite avec ce que la personne a bien voulu indiquer.
    try {
      await this.company.getOrCreate(user.id);
      const patch: Record<string, any> = {};
      if (extra.city) patch.city = extra.city;
      if (extra.address) patch.address = extra.address;
      if (extra.legalForm) patch.legalForm = extra.legalForm;
      if (extra.taxId) patch.taxId = extra.taxId;
      if (Object.keys(patch).length) await this.company.update(user.id, patch);
    } catch (e: any) {
      console.warn(`[auth] Fiche société incomplète pour le compte ${user.id} : ${e?.message || e}`);
    }
    void this.audit.record({ userId: user.id, actorId: user.id, actorEmail: user.email, action: 'account_registered', entity: 'account', entityId: user.id, ip: ip || null, status: 201, details: { sector: user.sector, source: user.signupSource, trialEndsAt: user.trialEndsAt } });
    const settings = await this.settings.get();
    if (settings.supportEmail) {
      void this.mail.trySend({
        to: settings.supportEmail, subject: `Nouvelle inscription — ${user.companyName || user.name}`,
        text: `${user.name} <${user.email}> vient de créer le compte « ${user.companyName || ''} » (secteur : ${user.sector || '—'}, téléphone : ${user.phone || '—'}).\nEssai jusqu’au ${user.trialEndsAt?.toISOString()}.\n\n${this.frontendUrl()}/admin/accounts`,
      });
    }
  }

  private async sendVerificationEmail(user: User, token: string, welcome: boolean): Promise<boolean> {
    const link = `${this.frontendUrl()}/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    const intro = welcome ? `Bienvenue sur Inovexa ERP. Votre essai gratuit est ouvert.` : `Voici votre nouveau lien de confirmation.`;
    const sent = await this.mail.trySend({
      to: user.email,
      subject: welcome ? 'Bienvenue sur Inovexa ERP — confirmez votre adresse email' : 'Confirmez votre adresse email — Inovexa ERP',
      text: `Bonjour ${user.name},\n\n${intro}\nConfirmez votre adresse email en ouvrant ce lien (valable 48 heures) :\n${link}\n\nL’équipe Inovexa ERP`,
      html: `<p>Bonjour ${escapeHtml(user.name)},</p><p>${escapeHtml(intro)}</p><p><a href="${link}">Confirmer mon adresse email</a> (lien valable 48 heures)</p><p>L’équipe Inovexa ERP</p>`,
    });
    if (!sent && process.env.NODE_ENV !== 'production') console.warn(`[auth] SMTP non configuré : lien de confirmation pour ${user.email} -> ${link}`);
    return sent;
  }

  async register(dto: RegisterDto, ip?: string) {
    if (dto.acceptTerms !== true) throw new BadRequestException('Vous devez accepter les conditions d’utilisation.');
    assertStrongPassword(dto.password);
    const email = dto.email.trim().toLowerCase();
    const checked = await this.checkSignup(dto.sector, dto.phone, dto.taxId);
    if (await this.findByEmail(email)) throw new ConflictException('Un compte existe déjà avec cet email. Connectez-vous, ou réinitialisez votre mot de passe.');

    const token = randomBytes(32).toString('hex');
    const user = await this.createOwner({
      email, name: dto.name.trim(), companyName: dto.companyName.trim(), phone: checked.phone, passwordHash: await bcrypt.hash(dto.password, 10),
      sectorCode: checked.sector.code, source: 'self', emailVerified: false, verifyHash: sha256(token),
    });
    await this.afterSignup(user, { city: dto.city, address: dto.address, legalForm: dto.legalForm, taxId: checked.taxId }, ip);
    const emailSent = await this.sendVerificationEmail(user, token, true);
    return { ...(await this.session(user, null)), emailSent };
  }

  async verifyEmail(email: string, token: string) {
    const normalized = (email || '').trim().toLowerCase();
    this.guardRateLimit(`verify:${normalized}`);
    const user = await this.findByEmail(normalized);
    if (user?.emailVerifiedAt) return { success: true, alreadyVerified: true, message: 'Adresse email déjà confirmée.' };
    const ok = !!user && !!user.emailVerifyHash && !!user.emailVerifyExpires && user.emailVerifyExpires.getTime() > Date.now() && user.emailVerifyHash === sha256(String(token || ''));
    if (!ok) {
      this.registerFailure(`verify:${normalized}`);
      throw new BadRequestException('Lien invalide ou expiré. Demandez un nouveau lien depuis votre espace.');
    }
    user!.emailVerifiedAt = new Date();
    user!.emailVerifyHash = null;
    user!.emailVerifyExpires = null;
    await this.userRepository.save(user!);
    void this.audit.record({ userId: user!.ownerId ?? user!.id, actorId: user!.id, actorEmail: user!.email, action: 'email_verified', entity: 'auth' });
    return { success: true, message: 'Adresse email confirmée.' };
  }

  async resendVerification(actorId: number) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) return { success: true, alreadyVerified: true };
    this.guardRateLimit(`resend:${user.id}`);
    this.registerFailure(`resend:${user.id}`); // 5 envois / 15 min
    const token = randomBytes(32).toString('hex');
    user.emailVerifyHash = sha256(token);
    user.emailVerifyExpires = new Date(Date.now() + 48 * 3600_000);
    await this.userRepository.save(user);
    const emailSent = await this.sendVerificationEmail(user, token, false);
    return { success: true, emailSent, message: emailSent ? 'Un nouveau lien vient de vous être envoyé.' : 'L’envoi d’emails n’est pas configuré : contactez l’administrateur.' };
  }

  // ───────────── Connexion et inscription avec Google ou Apple ─────────────

  /** Ce qui diffère d'un fournisseur d'identité à l'autre : la colonne qui garde son identifiant, et les messages. */
  private static readonly SOCIAL = {
    google: {
      column: 'googleSub' as const, action: 'login_google',
      otherAccount: 'Ce compte est relié à un autre compte Google.',
      notFound: 'Aucun compte n’est associé à cette adresse Google. Créez votre compte pour démarrer l’essai gratuit.',
    },
    apple: {
      column: 'appleSub' as const, action: 'login_apple',
      otherAccount: 'Ce compte est relié à un autre identifiant Apple.',
      notFound: 'Aucun compte n’est associé à cet identifiant Apple. Créez votre compte pour démarrer l’essai gratuit.',
    },
  };

  /**
   * Suite commune à Google et Apple, une fois le jeton d'identité vérifié :
   *  - compte existant (même identifiant chez le fournisseur, ou même adresse email vérifiée par lui) : connexion ;
   *  - sinon, avec intent = « register » : création d'une société en essai gratuit ;
   *  - sinon : 404 avec le code ACCOUNT_NOT_FOUND, et l'interface propose la création de compte.
   */
  private async socialSignIn(
    provider: 'google' | 'apple',
    identity: { sub: string; email: string | null; name: string },
    dto: { intent?: 'login' | 'register'; companyName?: string; sector?: string; phone?: string; acceptTerms?: boolean; otp?: string },
    ip?: string,
  ) {
    const p = AuthService.SOCIAL[provider];
    let user =
      (await this.userRepository.findOne({ where: { [p.column]: identity.sub } as any })) ??
      (identity.email ? await this.findByEmail(identity.email) : null);
    if (user) {
      // L'administrateur de la plateforme garde une authentification dédiée : mot de passe (+ double authentification).
      if (isPlatformAdmin(user.role)) throw new ForbiddenException('Ce compte se connecte avec son mot de passe.');
      if (user[p.column] && user[p.column] !== identity.sub) throw new UnauthorizedException(p.otherAccount);
      if (!user.isActive) throw new UnauthorizedException('Compte désactivé');
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        if (!dto.otp) throw new UnauthorizedException({ statusCode: 401, message: 'Code de vérification requis', error: 'Unauthorized', requires2fa: true });
        if (!verifyTotp(user.twoFactorSecret, dto.otp)) throw new UnauthorizedException({ statusCode: 401, message: 'Code de vérification invalide', error: 'Unauthorized', requires2fa: true });
      }
      let owner: User | null = null;
      if (user.ownerId) {
        owner = await this.userRepository.findOne({ where: { id: user.ownerId } });
        if (!owner || !owner.isActive) throw new UnauthorizedException('Le compte de la société est désactivé');
      }
      const patch: Partial<User> = { lastLoginAt: new Date() };
      if (!user[p.column]) patch[p.column] = identity.sub;
      if (!user.emailVerifiedAt) patch.emailVerifiedAt = new Date();
      await this.userRepository.update({ id: user.id }, patch);
      Object.assign(user, patch);
      void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: p.action, entity: 'auth', ip: ip || null, status: 200 });
      return { ...(await this.session(user, owner)), created: false };
    }

    if (dto.intent !== 'register') {
      throw new NotFoundException({ statusCode: 404, error: 'Not Found', code: 'ACCOUNT_NOT_FOUND', message: p.notFound, email: identity.email, name: identity.name });
    }
    if (!identity.email) throw new BadRequestException('Votre adresse email n’a pas été communiquée : autorisez son partage, ou créez votre compte avec votre email.');
    if (dto.acceptTerms !== true) throw new BadRequestException('Vous devez accepter les conditions d’utilisation.');
    const companyName = String(dto.companyName || '').trim();
    if (companyName.length < 2) throw new BadRequestException('Indiquez le nom de votre société.');
    const checked = await this.checkSignup(String(dto.sector || ''), dto.phone, undefined);
    user = await this.createOwner({
      email: identity.email, name: identity.name, companyName, phone: checked.phone,
      // Mot de passe aléatoire inutilisable : la personne peut en définir un avec « mot de passe oublié ».
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      sectorCode: checked.sector.code, source: provider, [p.column]: identity.sub, emailVerified: true,
    });
    await this.afterSignup(user, {}, ip);
    return { ...(await this.session(user, null)), created: true };
  }

  /**
   * « Continuer avec Google » : le navigateur envoie le jeton d'identité remis par Google ; il est vérifié ici
   * (signature, destinataire, expiration) avant toute recherche de compte.
   */
  async google(dto: GoogleAuthDto, ip?: string) {
    const clientId = this.settings.googleClientId();
    if (!clientId) throw new ServiceUnavailableException('La connexion avec Google n’est pas configurée sur ce serveur.');
    let identity;
    try {
      identity = await verifyGoogleIdToken(dto.credential, clientId);
    } catch (e: any) {
      void this.audit.record({ action: 'login_google_failed', entity: 'auth', ip: ip || null, status: 401, details: { error: String(e?.message || e).slice(0, 120) } });
      throw new UnauthorizedException('Jeton Google invalide ou expiré. Réessayez.');
    }
    if (!identity.emailVerified) throw new UnauthorizedException('Cette adresse Google n’est pas vérifiée.');
    return this.socialSignIn('google', { sub: identity.sub, email: identity.email, name: identity.name }, dto, ip);
  }

  /**
   * « Continuer avec Apple » : même principe, avec le jeton d'identité d'Apple. Le nom n'est pas dans le jeton (Apple ne
   * le remet au navigateur qu'à la première autorisation) : il arrive à part et ne sert qu'à l'affichage.
   */
  async apple(dto: AppleAuthDto, ip?: string) {
    const clientIds = this.settings.appleClientIds();
    if (!clientIds.length) throw new ServiceUnavailableException('La connexion avec Apple n’est pas configurée sur ce serveur.');
    let identity;
    try {
      identity = await verifyAppleIdToken(dto.identityToken, clientIds);
    } catch (e: any) {
      void this.audit.record({ action: 'login_apple_failed', entity: 'auth', ip: ip || null, status: 401, details: { error: String(e?.message || e).slice(0, 120) } });
      throw new UnauthorizedException('Jeton Apple invalide ou expiré. Réessayez.');
    }
    // Une adresse non vérifiée ne sert pas à retrouver un compte existant (elle ne prouve rien).
    const email = identity.emailVerified ? identity.email : null;
    const given = String(dto.name || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    const name = given.length >= 2 ? given : email ? email.split('@')[0].slice(0, 120) : 'Utilisateur Apple';
    return this.socialSignIn('apple', { sub: identity.sub, email, name }, dto, ip);
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
    // Le lien contient le jeton : il n'est écrit dans les journaux qu'en développement.
    if (!sent) console.warn(process.env.NODE_ENV === 'production' ? `[auth] Email SMTP non configuré : réinitialisation demandée pour ${user.email}, aucun email envoyé.` : `[auth] Email SMTP non configuré : lien de réinitialisation pour ${user.email} -> ${link}`);
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

  /** Ferme toutes les sessions de la personne et renvoie un nouveau jeton pour celle qui vient d'agir. */
  async rotateSession(actorId: number): Promise<string> {
    await this.userRepository.increment({ id: actorId }, 'tokenVersion', 1);
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    return this.jwtService.sign({ userId: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 });
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
