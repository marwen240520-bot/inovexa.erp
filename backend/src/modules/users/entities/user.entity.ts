import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'client' })
  role: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true, default: {} })
  modules: Record<string, boolean>;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @Column({ default: true })
  isActive: boolean;

  // Membre d'équipe : id du compte propriétaire dont il utilise les données (null = propriétaire / administrateur).
  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  // Droits supplémentaires accordés à ce membre en plus de son rôle (ex. ['documents:validate']).
  @Column({ type: 'jsonb', nullable: true })
  extraPermissions: string[] | null;

  // Authentification à deux facteurs (TOTP).
  @Column({ type: 'varchar', length: 80, nullable: true })
  twoFactorSecret: string | null;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  // Réinitialisation du mot de passe : on ne stocke que l'empreinte du lien envoyé par email.
  @Column({ type: 'varchar', length: 64, nullable: true })
  passwordResetHash: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  // Incrémenté pour déconnecter toutes les sessions (changement de mot de passe, « se déconnecter partout »).
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  // ───────────── SaaS : état du compte (valable pour le PROPRIÉTAIRE ; un membre d'équipe suit son propriétaire) ─────────────

  /** TRIAL | ACTIVE | EXPIRED | SUSPENDED | CANCELLED — voir modules/saas/account-access.ts. */
  @Column({ type: 'varchar', length: 12, default: 'ACTIVE' })
  accountStatus: string;

  /** Motif du dernier changement d'état (TRIAL_EXPIRED, SUBSCRIPTION_EXPIRED, texte saisi par l'administrateur…). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  statusReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  statusChangedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialStartedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt: Date | null;

  /** false = compte antérieur au SaaS : la date de fin d'abonnement est affichée mais ne bloque pas l'accès. */
  @Column({ default: true })
  expiryEnforced: boolean;

  /** Code du secteur d'activité (table sectors). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  sector: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  planCode: string | null;

  /** monthly | annual */
  @Column({ type: 'varchar', length: 10, nullable: true })
  billingCycle: string | null;

  /** Nombre maximal d'utilisateurs (propriétaire compris) ; null = pas de limite. */
  @Column({ type: 'int', nullable: true })
  userLimit: number | null;

  /** self | google | apple | admin */
  @Column({ type: 'varchar', length: 12, default: 'admin' })
  signupSource: string;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  emailVerifyHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerifyExpires: Date | null;

  // Code de vérification à 6 chiffres envoyé par email : seule son empreinte (HMAC) est gardée, jamais le code.
  @Column({ type: 'varchar', length: 64, nullable: true })
  emailCodeHash: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailCodeExpires: Date | null;

  /** Essais faits sur le code en cours (le code est annulé après 5 erreurs). */
  @Column({ type: 'int', default: 0 })
  emailCodeAttempts: number;

  /** Dernier envoi d'un code : un nouvel envoi n'est possible qu'après une minute. */
  @Column({ type: 'timestamptz', nullable: true })
  emailCodeSentAt: Date | null;

  /** Identifiant Google (« sub » du jeton d'identité) quand le compte est relié à Google. */
  @Index('UQ_users_google_sub', { unique: true, where: '"googleSub" IS NOT NULL' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  googleSub: string | null;

  /** Identifiant Apple (« sub » du jeton d'identité) quand le compte est relié à « Se connecter avec Apple ». */
  @Index('UQ_users_apple_sub', { unique: true, where: '"appleSub" IS NOT NULL' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  appleSub: string | null;

  /** Rappels déjà envoyés (0 = aucun) : évite d'envoyer deux fois le même email. */
  @Column({ type: 'int', default: 0 })
  trialReminderStage: number;

  @Column({ type: 'int', default: 0 })
  renewalReminderStage: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
