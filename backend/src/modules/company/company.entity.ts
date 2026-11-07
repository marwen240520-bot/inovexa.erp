import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../common/column-transformers';

/**
 * Fiche société : identité légale (mentions obligatoires des factures), paramètres fiscaux et de numérotation.
 * Une fiche par compte (userId). Les données de tous les modules sont rattachées à ce compte.
 */
@Entity('companies')
@Index('UQ_companies_user', ['userId'], { unique: true })
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 200, default: '' })
  legalName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  tradeName: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  legalForm: string | null; // SARL, SUARL, SA, personne physique…

  /** Matricule fiscal. */
  @Column({ type: 'varchar', length: 40, nullable: true })
  taxId: string | null;

  /** Registre du commerce. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  tradeRegister: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  cnssNumber: string | null;

  @Column({ type: 'numeric', precision: 16, scale: 3, nullable: true, transformer: numericTransformer })
  shareCapital: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 80, default: 'Tunisie' })
  country: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  website: string | null;

  /** Logo : image réduite en data URL (PNG/JPEG) pour les PDF. */
  @Column({ type: 'text', nullable: true })
  logoDataUrl: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  bankName: string | null;

  /** RIB / IBAN affiché sur les factures. */
  @Column({ type: 'varchar', length: 60, nullable: true })
  bankAccount: string | null;

  @Column({ type: 'varchar', length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19, transformer: numericTransformer })
  defaultVatRate: number;

  @Column({ default: true })
  stampDutyEnabled: boolean;

  @Column({ type: 'numeric', precision: 8, scale: 3, default: 1, transformer: numericTransformer })
  stampDutyAmount: number;

  /** flat = 1 DT fixe ; large_store = barème progressif des grandes surfaces (LF 2026). */
  @Column({ type: 'varchar', length: 20, default: 'flat' })
  stampScale: string;

  @Column({ type: 'numeric', precision: 14, scale: 3, default: 1000, transformer: numericTransformer })
  withholdingThreshold: number;

  @Column({ type: 'int', default: 30 })
  defaultPaymentTermsDays: number;

  @Column({ type: 'int', default: 30 })
  quoteValidityDays: number;

  /** Préfixes de numérotation par type de pièce (ex. { invoice: 'FA', quote: 'DV' }). */
  @Column({ type: 'jsonb', nullable: true })
  numbering: Record<string, string> | null;

  /** Correspondance fonction -> numéro de compte comptable (voir AccountingService.DEFAULT_ACCOUNT_MAP). */
  @Column({ type: 'jsonb', nullable: true })
  accountMap: Record<string, string> | null;

  /** Paramètres de paie (taux CNSS, barème IRPP…) : modifiables, car ils changent avec chaque loi de finances. */
  @Column({ type: 'jsonb', nullable: true })
  payrollSettings: any;

  @Column({ type: 'text', nullable: true })
  invoiceFooter: string | null;

  @Column({ type: 'text', nullable: true })
  defaultNotes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
