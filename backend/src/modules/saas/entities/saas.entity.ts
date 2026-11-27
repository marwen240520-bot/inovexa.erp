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

  /**
   * true = à l'inscription par email, l'ERP reste fermé tant que le code à 6 chiffres reçu par email n'est pas saisi.
   * La règle ne s'applique que si le serveur sait envoyer des emails (SMTP configuré) : sans cela, personne ne recevrait
   * son code — voir SaasSettingsService.verificationRequired().
   */
  @Column({ default: true })
  requireEmailVerification: boolean;

  /** Devise des formules et des paiements d'abonnement (USD par défaut). Flouci encaisse en dinars : une autre devise est convertie (FLOUCI_RATE_<DEVISE>). */
  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  /** TVA appliquée aux prix des formules affichés (les prix saisis sont hors taxes). */
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19, transformer: numericTransformer })
  vatRate: number;

  /**
   * false (par défaut) = le client paie uniquement en ligne par carte, et son accès s'ouvre tout seul.
   * true = le client peut aussi déclarer un paiement hors ligne (virement, chèque…), que l'administrateur valide.
   */
  @Column({ default: false })
  manualPayments: boolean;

  /** Instructions de paiement hors ligne affichées au client (RIB, D17, espèces…) : saisies par l'administrateur. */
  @Column({ type: 'text', nullable: true })
  paymentInstructions: string | null;

  /** Moyens de paiement proposés pour la déclaration manuelle. */
  @Column({ type: 'jsonb', nullable: true })
  paymentMethods: string[] | null;

  /**
   * Lien de paiement en ligne par carte (page de paiement de votre prestataire : Flouci, Paymee, ClicToPay…).
   * Affiché au client quand il choisit « Carte bancaire » ; il y règle puis déclare la référence de la transaction.
   */
  @Column({ type: 'varchar', length: 300, nullable: true })
  paymentLink: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  supportEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  supportPhone: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  supportWhatsapp: string | null;

  /** Identité de l'éditeur imprimée sur les reçus : raison sociale, matricule fiscal, adresse, registre du commerce. */
  @Column({ type: 'varchar', length: 160, nullable: true })
  issuerName: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  issuerTaxId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  issuerAddress: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  issuerRegistry: string | null;

  /** Heures avant la fin de l'essai auxquelles un rappel est envoyé. */
  @Column({ type: 'int', default: 24 })
  trialReminderHours: number;

  /** Jours avant l'échéance d'un abonnement auxquels un rappel est envoyé. */
  @Column({ type: 'int', default: 7 })
  renewalReminderDays: number;

  /** Les formules, secteurs et prestations par défaut ont déjà été créés (ne pas les recréer si on les supprime). */
  @Column({ default: false })
  defaultsSeeded: boolean;

  /** Version du contenu de départ déjà reportée dans cette base (voir CATALOG_VERSION dans saas-defaults.ts). */
  @Column({ type: 'int', default: 1 })
  catalogVersion: number;

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

/**
 * Paiement d'abonnement.
 *  - En ligne par carte ou application Flouci (provider = flouci) : créé à l'ouverture de la page de paiement (status = initiated), validé
 *    AUTOMATIQUEMENT dès que le prestataire confirme l'encaissement ; « expired » si la page de paiement est abandonnée.
 *  - Hors ligne (provider = manual) : déclaré par le client ou saisi par l'administrateur (pending), puis validé ou
 *    refusé par l'administrateur.
 */
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

  /** bank_transfer | d17 | flouci | edinar | postal | cheque | cash | card | other */
  @Column({ type: 'varchar', length: 20 })
  method: string;

  /** manual = validation par l'administrateur ; sinon le nom du prestataire de paiement en ligne (flouci ; konnect pour les anciens paiements). */
  @Column({ type: 'varchar', length: 30, default: 'manual' })
  provider: string;

  /** Référence du paiement chez le prestataire (Flouci : payment_id). */
  @Index('IDX_subscription_payments_provider_ref', { where: '"providerRef" IS NOT NULL' })
  @Column({ type: 'varchar', length: 80, nullable: true })
  providerRef: string | null;

  /**
   * Montant réellement débité par le prestataire et sa devise (Flouci : toujours en dinars). Différent de amountTTC quand les
   * formules sont dans une autre devise (montant TTC converti au taux FLOUCI_RATE_<DEVISE> du moment). null = hors ligne.
   */
  @Column({ ...PRICE, nullable: true })
  chargedAmount: number | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  chargedCurrency: string | null;

  /** Adresse de la page de paiement du prestataire, tant que le paiement est ouvert. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  checkoutUrl: string | null;

  /** Fin de validité de la page de paiement. */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  /** Adresse du site où ramener le client après le paiement (celle d'où il est parti). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  returnBase: string | null;

  /** Référence communiquée par le client (numéro de virement, de chèque…). */
  @Column({ type: 'varchar', length: 120, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note: string | null;

  /** initiated | expired (paiement en ligne non abouti) | pending | validated | rejected | cancelled | refunded */
  @Column({ type: 'varchar', length: 12, default: 'pending' })
  status: string;

  /** Motif du refus d'une déclaration, ou du remboursement d'un paiement validé. */
  @Column({ type: 'varchar', length: 300, nullable: true })
  rejectReason: string | null;

  /** client | admin */
  @Column({ type: 'varchar', length: 10, default: 'client' })
  declaredBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  /** Administrateur qui a validé ou refusé ; null pour un paiement en ligne (validation automatique). */
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

/**
 * Anciens messages des clients à l'administrateur. Le formulaire « Écrire à l'administrateur » a été retiré (tout se fait
 * en ligne) : cette table n'est plus alimentée, elle est conservée pour ne perdre aucun message déjà reçu.
 */
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
