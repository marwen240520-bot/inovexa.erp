import { Injectable, UnauthorizedException, ConflictException, HttpException, HttpStatus, BadRequestException, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { MailService } from '../../common/mail/mail.service';
import { emailChangedMail, passwordResetMail, pickMailLang, securityNoticeMail, verificationCodeMail, type SecurityNotice } from '../../common/mail/auth-mails';
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
import { JWT_SECRET } from './jwt.strategy';
import { frontendUrl } from '../../common/origins';
import { PASSWORD_MESSAGES, passwordProblem } from '../../common/security/passwords';

/**
 * 8 caractères minimum, une lettre et un chiffre ; ni un des mots de passe les plus répandus, ni l'adresse email du compte
 * (voir common/security/passwords.ts). `email` : l'adresse du compte, quand on la connaît.
 */
export function assertStrongPassword(password: string, email?: string | null) {
  const problem = passwordProblem(password, { email });
  if (problem) throw new BadRequestException(PASSWORD_MESSAGES[problem]);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// ───────────── Code de vérification de l'adresse email ─────────────
/** Durée de validité d'un code. */
export const EMAIL_CODE_MINUTES = 15;
/** Essais permis sur un même code : au-delà, il faut en demander un nouveau. */
export const EMAIL_CODE_MAX_ATTEMPTS = 5;
/** Délai entre deux envois. */
export const EMAIL_CODE_RESEND_SECONDS = 60;
/**
 * Empreinte du code gardée en base. Un code n'a que 6 chiffres : elle est calculée avec la clé du serveur (HMAC),
 * pour qu'une copie de la base ne permette pas de retrouver les codes en les essayant tous.
 */
const emailCodeHash = (userId: number, code: string) => createHmac('sha256', JWT_SECRET).update(`email-code:${userId}:${code}`).digest('hex');

@Injectable()
export class AuthService {
  // Hash factice : un bcrypt.compare est toujours exécuté -> temps de réponse
  // constant, ce qui empêche l'énumération des comptes par mesure du temps.
  private readonly dummyHash = bcrypt.hashSync('inovexa-dummy-password-x9f3', 10);

  // Limiteur de tentatives en mémoire, par email.
  private attempts = new Map<string, { count: number; resetAt: number; blockedUntil: number }>();
  /** Échecs permis par clé (adresse email + adresse IP à la connexion ; une seule clé ailleurs). */
  private readonly MAX_ATTEMPTS = 5;
  /** Échecs permis pour une même adresse email, toutes adresses IP confondues : bloque une attaque répartie sur plusieurs machines. */
  private readonly MAX_ATTEMPTS_PER_EMAIL = 30;
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
    return frontendUrl();
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

  private registerFailure(key: string, max = this.MAX_ATTEMPTS) {
    const now = Date.now();
    // Les clés d'une fenêtre écoulée ne servent plus à rien : on les retire pour que la table ne grossisse pas sans fin.
    if (this.attempts.size > 5000) {
      for (const [k, r] of this.attempts) if (r.resetAt < now && r.blockedUntil < now) this.attempts.delete(k);
    }
    let rec = this.attempts.get(key);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + this.WINDOW_MS, blockedUntil: 0 };
    }
    rec.count += 1;
    if (rec.count >= max) {
      rec.blockedUntil = now + this.BLOCK_MS;
    }
    this.attempts.set(key, rec);
  }

  private resetAttempts(key: string) {
    this.attempts.delete(key);
  }

  /**
   * Échec de connexion : compté pour (adresse email + adresse IP) — 5 échecs bloquent CETTE machine pour ce compte — et, plus
   * largement, pour l'adresse email seule (30 échecs toutes machines confondues). Ainsi, quelqu'un qui tape au hasard sur le compte
   * d'un client ne peut pas l'empêcher de se connecter depuis chez lui, mais personne ne peut non plus essayer des milliers de
   * mots de passe en se répartissant sur plusieurs adresses.
   */
  private loginFailure(email: string, ipKey: string) {
    this.registerFailure(ipKey);
    this.registerFailure(email, this.MAX_ATTEMPTS_PER_EMAIL);
  }

  async login(email: string, password: string, otp?: string, ip?: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const ipKey = `${normalizedEmail}|${ip || 'inconnue'}`;
    this.guardRateLimit(ipKey);
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
      this.loginFailure(normalizedEmail, ipKey);
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
        this.loginFailure(normalizedEmail, ipKey);
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
    this.resetAttempts(ipKey);
    await this.userRepository.update({ id: user.id }, { lastLoginAt: new Date() });
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'login', entity: 'auth', ip: ip || null, status: 200 });

    // Adresse pas encore vérifiée et code exigé : un code part tout de suite (sauf s'il en reste un valable),
    // l'écran de saisie s'ouvre juste après la connexion.
    if (!owner && !user.emailVerifiedAt && user.signupSource === 'self' && this.settings.verificationRequired(await this.settings.get())) {
      const active = !!user.emailCodeHash && !!user.emailCodeExpires && new Date(user.emailCodeExpires).getTime() > Date.now() + 60_000 && (user.emailCodeAttempts ?? 0) < EMAIL_CODE_MAX_ATTEMPTS;
      if (!active) await this.issueEmailCode(user, false).catch(() => undefined);
    }

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
    source: 'self' | 'google' | 'apple'; googleSub?: string | null; appleSub?: string | null; emailVerified: boolean; verifyHash?: string | null; language?: string;
  }): Promise<User> {
    const now = new Date();
    const trial = await this.subscriptions.trialDates(now);
    const user = this.userRepository.create({
      email: input.email, password: input.passwordHash, name: input.name, companyName: input.companyName, phone: input.phone,
      role: 'client', isActive: true, ownerId: null,
      modules: await this.subscriptions.sectorModules(input.sectorCode), sector: input.sectorCode,
      accountStatus: 'TRIAL', trialStartedAt: trial.trialStartedAt, trialEndsAt: trial.trialEndsAt, expiryEnforced: true, statusChangedAt: now,
      signupSource: input.source, googleSub: input.googleSub ?? null, appleSub: input.appleSub ?? null, language: pickMailLang(input.language),
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

  /**
   * Tire un nouveau code à 6 chiffres, n'en garde que l'empreinte, et l'envoie par email.
   * Renvoie false si l'email n'a pas pu partir (serveur d'envoi non configuré ou en panne).
   */
  private async issueEmailCode(user: User, welcome: boolean, languageHint?: string): Promise<boolean> {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const now = new Date();
    user.emailCodeHash = emailCodeHash(user.id, code);
    user.emailCodeExpires = new Date(now.getTime() + EMAIL_CODE_MINUTES * 60_000);
    user.emailCodeAttempts = 0;
    user.emailCodeSentAt = now;
    await this.userRepository.update({ id: user.id }, { emailCodeHash: user.emailCodeHash, emailCodeExpires: user.emailCodeExpires, emailCodeAttempts: 0, emailCodeSentAt: now });
    const page = `${this.frontendUrl()}/auth/verify-email`;
    const mail = verificationCodeMail({ lang: pickMailLang(languageHint, user.language), name: user.name, code, minutes: EMAIL_CODE_MINUTES, url: page, welcome });
    const sent = await this.mail.trySend({ to: user.email, ...mail });
    // Le code n'apparaît dans les journaux qu'en développement, quand aucun serveur d'envoi n'est configuré.
    if (!sent && process.env.NODE_ENV !== 'production') console.warn(`[auth] SMTP non configuré : code de vérification pour ${user.email} -> ${code}`);
    return sent;
  }

  /** Ce que l'écran de saisie du code doit savoir. */
  private verificationInfo(required: boolean, sent: boolean) {
    return { required, sent, expiresInMinutes: EMAIL_CODE_MINUTES, resendInSeconds: EMAIL_CODE_RESEND_SECONDS };
  }

  async register(dto: RegisterDto, ip?: string) {
    if (dto.acceptTerms !== true) throw new BadRequestException('Vous devez accepter les conditions d’utilisation.');
    assertStrongPassword(dto.password, dto.email);
    const email = dto.email.trim().toLowerCase();
    const checked = await this.checkSignup(dto.sector, dto.phone, dto.taxId);
    if (await this.findByEmail(email)) throw new ConflictException('Un compte existe déjà avec cet email. Connectez-vous, ou réinitialisez votre mot de passe.');

    const user = await this.createOwner({
      email, name: dto.name.trim(), companyName: dto.companyName.trim(), phone: checked.phone, passwordHash: await bcrypt.hash(dto.password, 10),
      sectorCode: checked.sector.code, source: 'self', emailVerified: false, language: dto.language,
    });
    await this.afterSignup(user, { city: dto.city, address: dto.address, legalForm: dto.legalForm, taxId: checked.taxId }, ip);
    // Le code part dès que le serveur sait envoyer des emails ; il n'est EXIGÉ que si le réglage est actif.
    const emailSent = this.mail.isConfigured() || process.env.NODE_ENV !== 'production' ? await this.issueEmailCode(user, true, dto.language) : false;
    const required = this.settings.verificationRequired(await this.settings.get());
    return { ...(await this.session(user, null)), emailSent, verification: this.verificationInfo(required, emailSent) };
  }

  /** Ancien lien de confirmation (envoyé avant l'arrivée du code) : il reste valable jusqu'à son expiration. */
  async verifyEmail(email: string, token: string) {
    const normalized = (email || '').trim().toLowerCase();
    this.guardRateLimit(`verify:${normalized}`);
    const user = await this.findByEmail(normalized);
    if (user?.emailVerifiedAt) return { success: true, alreadyVerified: true, message: 'Adresse email déjà confirmée.' };
    const ok = !!user && !!user.emailVerifyHash && !!user.emailVerifyExpires && user.emailVerifyExpires.getTime() > Date.now() && user.emailVerifyHash === sha256(String(token || ''));
    if (!ok) {
      this.registerFailure(`verify:${normalized}`);
      throw new BadRequestException('Lien invalide ou expiré. Connectez-vous pour recevoir un code de vérification.');
    }
    await this.markEmailVerified(user!);
    return { success: true, message: 'Adresse email confirmée.' };
  }

  private async markEmailVerified(user: User, byAdmin = false) {
    const patch = { emailVerifiedAt: new Date(), emailVerifyHash: null, emailVerifyExpires: null, emailCodeHash: null, emailCodeExpires: null, emailCodeAttempts: 0 };
    await this.userRepository.update({ id: user.id }, patch);
    Object.assign(user, patch);
    // Confirmée par la personne elle-même : on le journalise ici. Confirmée par l'administrateur : c'est lui qui est journalisé.
    if (!byAdmin) void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'email_verified', entity: 'auth' });
  }

  /**
   * Vérifie le code à 6 chiffres saisi par la personne connectée. Cinq erreurs annulent le code : il faut alors en
   * demander un nouveau (un envoi par minute), ce qui rend l'essai systématique des 1 000 000 de codes impraticable.
   */
  async verifyEmailCode(actorId: number, code: string) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    const owner = user.ownerId ? await this.userRepository.findOne({ where: { id: user.ownerId } }) : null;
    const done = async (extra: Record<string, unknown>) => ({
      success: true, ...extra,
      account: !isPlatformAdmin(user.role) && (owner ?? user).role === 'client' ? this.subscriptions.view(owner ?? user, await this.settings.get()) : null,
    });
    if (user.emailVerifiedAt) return done({ alreadyVerified: true, message: 'Adresse email déjà confirmée.' });

    const fail = (reason: 'CODE_EXPIRED' | 'CODE_LOCKED' | 'CODE_INVALID', message: string, remaining?: number) =>
      new BadRequestException({ statusCode: 400, error: 'Bad Request', code: reason, message, ...(remaining !== undefined ? { remainingAttempts: remaining } : {}) });
    if (!user.emailCodeHash || !user.emailCodeExpires || new Date(user.emailCodeExpires).getTime() <= Date.now()) {
      throw fail('CODE_EXPIRED', 'Ce code a expiré. Demandez-en un nouveau.');
    }
    if ((user.emailCodeAttempts ?? 0) >= EMAIL_CODE_MAX_ATTEMPTS) throw fail('CODE_LOCKED', 'Trop d’essais sur ce code. Demandez-en un nouveau.');

    const given = Buffer.from(emailCodeHash(user.id, String(code || '')), 'hex');
    const expected = Buffer.from(user.emailCodeHash, 'hex');
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      // Compteur incrémenté en base (et non en mémoire) : il tient même avec plusieurs serveurs ou après un redémarrage.
      await this.userRepository.increment({ id: user.id }, 'emailCodeAttempts', 1);
      const remaining = Math.max(0, EMAIL_CODE_MAX_ATTEMPTS - ((user.emailCodeAttempts ?? 0) + 1));
      void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'email_code_failed', entity: 'auth', status: 400 });
      throw remaining > 0
        ? fail('CODE_INVALID', `Code incorrect. Il vous reste ${remaining} essai${remaining > 1 ? 's' : ''}.`, remaining)
        : fail('CODE_LOCKED', 'Trop d’essais sur ce code. Demandez-en un nouveau.', 0);
    }
    await this.markEmailVerified(user);
    return done({ message: 'Adresse email confirmée.' });
  }

  /** Envoie un nouveau code (un par minute, cinq par quart d'heure). */
  async resendVerification(actorId: number, language?: string) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) return { success: true, alreadyVerified: true };
    const wait = user.emailCodeSentAt ? Math.ceil((new Date(user.emailCodeSentAt).getTime() + EMAIL_CODE_RESEND_SECONDS * 1000 - Date.now()) / 1000) : 0;
    if (wait > 0) {
      throw new HttpException({ statusCode: 429, error: 'Too Many Requests', code: 'CODE_TOO_SOON', retryInSeconds: wait, message: `Un code vient de vous être envoyé. Vous pourrez en demander un autre dans ${wait} s.` }, HttpStatus.TOO_MANY_REQUESTS);
    }
    this.guardRateLimit(`resend:${user.id}`);
    this.registerFailure(`resend:${user.id}`); // 5 envois / 15 min
    const emailSent = await this.issueEmailCode(user, false, language);
    return {
      success: true, emailSent, ...this.verificationInfo(this.settings.verificationRequired(await this.settings.get()), emailSent),
      message: emailSent ? 'Un nouveau code vient de vous être envoyé.' : 'L’envoi d’emails n’est pas disponible pour le moment. Réessayez plus tard.',
    };
  }

  // ───────────── Outils d'administration de la vérification ─────────────

  private async verifiableTarget(targetId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: targetId } });
    // Le compte de la plateforme n'a pas d'adresse à confirmer ; un membre d'équipe est confirmé par son propriétaire.
    if (!user || isPlatformAdmin(user.role)) throw new NotFoundException('Compte introuvable.');
    return user;
  }

  /** L'administrateur confirme lui-même l'adresse d'un compte (client joint par téléphone, boîte de réception inaccessible). */
  async adminMarkEmailVerified(targetId: number, admin: { id: number; email?: string | null }, ip?: string) {
    const user = await this.verifiableTarget(targetId);
    if (user.emailVerifiedAt) return { success: true, alreadyVerified: true, verifiedAt: user.emailVerifiedAt };
    await this.markEmailVerified(user, true);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: admin.id, actorEmail: admin.email ?? null, action: 'email_verified_by_admin', entity: 'account', entityId: user.id, ip: ip || null, status: 200, details: { email: user.email } });
    return { success: true, alreadyVerified: false, verifiedAt: user.emailVerifiedAt };
  }

  /** L'administrateur renvoie un code de vérification au client, sans le délai d'attente imposé au client lui-même. */
  async adminSendVerificationCode(targetId: number, admin: { id: number; email?: string | null }, language?: string, ip?: string) {
    const user = await this.verifiableTarget(targetId);
    if (user.emailVerifiedAt) return { success: true, alreadyVerified: true, emailSent: false };
    if (!this.mail.isConfigured()) throw new ServiceUnavailableException('L’envoi d’emails n’est pas configuré sur le serveur (variables SMTP_*).');
    const emailSent = await this.issueEmailCode(user, false, language);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: admin.id, actorEmail: admin.email ?? null, action: 'email_code_sent_by_admin', entity: 'account', entityId: user.id, ip: ip || null, status: 200, details: { email: user.email, emailSent } });
    return { success: true, alreadyVerified: false, emailSent };
  }

  // ───────────── Changement d'adresse email ─────────────

  /**
   * Remplace l'adresse email du compte (faute de frappe à l'inscription, changement de messagerie).
   *  - le mot de passe actuel est exigé : une session volée ne suffit pas à détourner le compte ;
   *  - un propriétaire inscrit par email doit confirmer la NOUVELLE adresse : un code y part tout de suite ;
   *  - l'ancienne adresse est prévenue du changement ;
   *  - un compte relié à Google ou à Apple garde l'adresse que ce fournisseur a vérifiée.
   */
  async changeEmail(actorId: number, rawEmail: string, password: string, language?: string, ip?: string) {
    const user = await this.userRepository.findOne({ where: { id: actorId } });
    if (!user) throw new UnauthorizedException();
    const email = String(rawEmail ?? '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 190) throw new BadRequestException('Email invalide.');
    if (email === String(user.email).trim().toLowerCase()) return { success: true, changed: false, email: user.email };
    if (user.signupSource === 'google' || user.signupSource === 'apple') {
      throw new BadRequestException(`Ce compte est relié à ${user.signupSource === 'google' ? 'Google' : 'Apple'} : son adresse email ne peut pas être modifiée ici.`);
    }
    this.guardRateLimit(`chmail:${user.id}`);
    if (!(await bcrypt.compare(password || '', user.password))) {
      this.registerFailure(`chmail:${user.id}`);
      void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'email_change_failed', entity: 'auth', ip: ip || null, status: 401 });
      throw new UnauthorizedException('Mot de passe incorrect');
    }
    if (await this.findByEmail(email)) throw new ConflictException('Cet email est déjà utilisé.');

    const previous = user.email;
    const reverify = !user.ownerId && user.signupSource === 'self';
    const patch: Partial<User> = { email };
    if (reverify) Object.assign(patch, { emailVerifiedAt: null, emailVerifyHash: null, emailVerifyExpires: null, emailCodeHash: null, emailCodeExpires: null, emailCodeAttempts: 0, emailCodeSentAt: null });
    try {
      await this.userRepository.update({ id: user.id }, patch);
    } catch (e: any) {
      if (e?.code === '23505' || e?.driverError?.code === '23505') throw new ConflictException('Cet email est déjà utilisé.');
      throw e;
    }
    Object.assign(user, patch);
    this.resetAttempts(`chmail:${user.id}`);

    // L'ancienne adresse est prévenue ; la nouvelle reçoit le code à saisir.
    void this.mail.trySend({ to: previous, ...emailChangedMail({ lang: pickMailLang(language, user.language), name: user.name, newEmail: email }) });
    const emailSent = reverify && (this.mail.isConfigured() || process.env.NODE_ENV !== 'production') ? await this.issueEmailCode(user, false, language) : false;
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: email, action: 'email_changed', entity: 'auth', ip: ip || null, status: 200, details: { reverify } });
    const required = this.settings.verificationRequired(await this.settings.get());
    return { success: true, changed: true, email, reverify, emailSent, verification: this.verificationInfo(required && reverify, emailSent) };
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
    dto: { intent?: 'login' | 'register'; companyName?: string; sector?: string; phone?: string; acceptTerms?: boolean; otp?: string; language?: string },
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
      sectorCode: checked.sector.code, source: provider, [p.column]: identity.sub, emailVerified: true, language: dto.language,
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
  async forgotPassword(email: string, language?: string) {
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

    const link = `${this.frontendUrl()}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    const mail = passwordResetMail({ lang: pickMailLang(language, user.language), name: user.name, link, minutes: 60 });
    const sent = await this.mail.trySend({ to: user.email, ...mail });
    // Le lien contient le jeton : il n'est écrit dans les journaux qu'en développement.
    if (!sent) console.warn(process.env.NODE_ENV === 'production' ? `[auth] Email SMTP non configuré : réinitialisation demandée pour ${user.email}, aucun email envoyé.` : `[auth] Email SMTP non configuré : lien de réinitialisation pour ${user.email} -> ${link}`);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: user.id, actorEmail: user.email, action: 'password_reset_requested', entity: 'auth' });
    return generic;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    assertStrongPassword(newPassword, email);
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
    this.notifySecurity(user!, 'password_changed');
    return { success: true, message: 'Mot de passe modifié. Vous pouvez vous connecter.' };
  }

  /** Prévient la personne, par email et dans sa langue, d'un changement de sécurité sur son compte (jamais bloquant). */
  notifySecurity(user: Pick<User, 'email' | 'name' | 'language'>, kind: SecurityNotice) {
    void this.mail.trySend({ to: user.email, ...securityNoticeMail({ lang: pickMailLang(user.language), name: user.name, kind }) });
  }

  /** Notification après un changement de mot de passe fait depuis le profil (appelée par le contrôleur des utilisateurs). */
  async notifyPasswordChanged(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) this.notifySecurity(user, 'password_changed');
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
    this.notifySecurity(user, 'two_factor_enabled');
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
    this.notifySecurity(user, 'two_factor_disabled');
    return { success: true, twoFactorEnabled: false };
  }

  /**
   * Le support réinitialise la double authentification d'un client qui a perdu son téléphone. Réservé aux comptes clients :
   * celle d'un administrateur ne se réinitialise que depuis le serveur (ADMIN_RESET_2FA=true), pour qu'un seul compte
   * administrateur compromis ne puisse pas affaiblir les autres. Les sessions du compte sont fermées et le titulaire est prévenu.
   */
  async adminResetTwoFactor(targetId: number, admin: { id: number; email?: string | null }, ip?: string) {
    const user = await this.userRepository.findOne({ where: { id: targetId } });
    if (!user) throw new NotFoundException('Compte introuvable.');
    if (isPlatformAdmin(user.role)) throw new ForbiddenException('La double authentification d’un administrateur se réinitialise depuis le serveur (ADMIN_RESET_2FA=true, voir docs/OPERATIONS.md).');
    if (!user.twoFactorEnabled && !user.twoFactorSecret) return { success: true, alreadyDisabled: true };
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userRepository.save(user);
    void this.audit.record({ userId: user.ownerId ?? user.id, actorId: admin.id, actorEmail: admin.email ?? null, action: 'two_factor_reset_by_admin', entity: 'account', entityId: user.id, ip: ip || null, status: 200 });
    this.notifySecurity(user, 'two_factor_reset');
    return { success: true, alreadyDisabled: false };
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
