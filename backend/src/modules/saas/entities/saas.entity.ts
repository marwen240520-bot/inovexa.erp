import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

const PRICE = { type: 'numeric' as const, precision: 12, scale: 3, transformer: numericTransformer };

/** Réglages de la plateforme (une seule ligne, id = 1) : modifiables par l'administrateur. */
@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn()
  id: number;

  /** Durée de l'essai gratuit, en heures (72 = 3 jours). */
  @Column({ type: 'int', default: 72 })
  trialHours: number;

  /** true = l'ERP reste fermé tant que l'adresse email n'est pas confirmée (nécessite un SMTP configuré). */
  @Column({ default: false })
  requireEmailVerification: boolean;

  @Column({ type: 'varchar', length: 3, default: 'TND' })
  currency: string;

  /** TVA appliquée aux prix des formules affichés (les prix saisis sont hors taxes). */
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19, transformer: numericTransformer })
  vatRate: number;

  /** Instructions de paiement affichées au client (RIB, D17, espèces…) : saisies par l'administrateur. */
  @Column({ type: 'text', nullable: true })
  paymentInstructions: string | null;

  /** Moyens de paiement proposés pour la déclaration manuelle. */
  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: string[] | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  supportEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  supportPhone: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  supportWhatsapp: string | null;

  /** Heures avant la fin de l'essai auxquelles un rappel est envoyé. */
  @Column({ type: 'int', default: 24 })
  trialReminderHours: number;

  /** Jours avant l'échéance d'un abonnement auxquels un rappel est envoyé. */
  @Column({ type: 'int', default: 7 })
  renewalReminderDays: number;

  /** Les formules, secteurs et prestations par défaut ont déjà été créés (ne pas les recréer si on les supprime). */
  @Column({ default: false })
  defaultsSeeded: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Formule d'abonnement. Les prix sont hors taxes ; null = « sur devis ». */
@Entity('plans')
@Index('UQ_plans_code', ['code'], { unique: true })
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  description: string | null;

  @Column({ ...PRICE, nullable: true })
  priceMonthly: number | null;

  @Column({ ...PRICE, nullable: true })
  priceAnnual: number | null;

  /** Nombre maximal d'utilisateurs (propriétaire compris) ; null = illimité. */
  @Column({ type: 'int', nullable: true })
  maxUsers: number | null;

  /** Modules inclus (clés de MODULE_KEYS) ; null = tous. */
  @Column({ type: 'jsonb', nullable: true })
  modules: string[] | null;

  /** Arguments affichés sur la page Tarifs. */
  @Column({ type: 'jsonb', nullable: true })
  features: string[] | null;

  /** false = brouillon : visible par l'administrateur seulement, tant qu'il n'a pas validé les prix. */
  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  highlight: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Paiement d'abonnement : déclaré par le client ou saisi par l'administrateur, puis validé (ou refusé) par l'administrateur. */
@Entity('subscription_payments')
@Index('IDX_subscription_payments_user', ['userId', 'createdAt'])
@Index('IDX_subscription_payments_status', ['status'])
export class SubscriptionPayment {
  @PrimaryGeneratedColumn()
  id: number;

  /** Compte (propriétaire) concerné. */
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 40 })
  planCode: string;

  @Column({ type: 'varchar', length: 80 })
  planName: string;

  /** monthly | annual */
  @Column({ type: 'varchar', length: 10 })
  billingCycle: string;

  @Column({ type: 'int', default: 1 })
  periodMonths: number;

  /** Montant hors taxes, figé au moment de la déclaration. */
  @Column({ ...PRICE })
  amountHT: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  vatRate: number;

  @Column({ ...PRICE })
  amountTTC: number;

  @Column({ type: 'varchar', length: 3, default: 'TND' })
  currency: string;

  /** bank_transfer | cash | cheque | d17 | card | other */
  @Column({ type: 'varchar', length: 20 })
  method: string;

  /** manual = validation par l'administrateur ; sinon le nom du prestataire de paiement en ligne. */
  @Column({ type: 'varchar', length: 30, default: 'manual' })
  provider: string;

  /** Référence communiquée par le client (numéro de virement, de chèque…). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  /** pending | validated | rejected | cancelled */
  @Column({ type: 'varchar', length: 12, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  rejectReason: string | null;

  /** client | admin */
  @Column({ type: 'varchar', length: 10, default: 'client' })
  declaredBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  /** Administrateur qui a validé ou refusé. */
  @Column({ type: 'int', nullable: true })
  validatedBy: number | null;

  /** Période d'abonnement ouverte par ce paiement. */
  @Column({ type: 'timestamptz', nullable: true })
  periodStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  periodEnd: Date | null;

  /** Numéro du reçu, attribué à la validation (REC-AAAA-00001). */
  @Index('UQ_subscription_payments_receipt', { unique: true, where: '"receiptNumber" IS NOT NULL' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  receiptNumber: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

/** Message d'un client à l'administrateur de la plateforme (page Abonnement), consultable même sans SMTP. */
@Entity('support_messages')
@Index('IDX_support_messages_user', ['userId', 'createdAt'])
export class SupportMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @Column({ type: 'varchar', length: 160 })
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
