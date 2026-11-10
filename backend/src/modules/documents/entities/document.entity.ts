import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { MONEY, numericTransformer } from '../../../common/column-transformers';

export const SALES_TYPES = ['quote', 'delivery_note', 'invoice', 'credit_note'] as const;
export const PURCHASE_TYPES = ['purchase_order', 'goods_receipt', 'supplier_invoice', 'supplier_credit_note'] as const;
export type DocumentType = (typeof SALES_TYPES)[number] | (typeof PURCHASE_TYPES)[number];
export const DOCUMENT_TYPES: DocumentType[] = [...SALES_TYPES, ...PURCHASE_TYPES];

export type DocumentStatus =
  | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
  | 'validated' | 'confirmed' | 'partially_received' | 'received' | 'delivered' | 'invoiced'
  | 'cancelled' | 'credited';

export type PaymentStatus = 'none' | 'unpaid' | 'partial' | 'paid';

/**
 * Document commercial unique pour tout le cycle : devis, bon de livraison, facture, avoir (ventes) et
 * bon de commande, bon de réception, facture et avoir fournisseur (achats). Les lignes sont dans `document_lines`.
 *
 * Immuabilité : dès qu'un document est VALIDÉ (`lockedAt` renseigné) il reçoit son numéro légal et plus rien
 * ne peut être modifié ni supprimé. Une erreur se corrige par un avoir.
 */
@Entity('documents')
@Index('UQ_documents_number', ['userId', 'type', 'number'], { unique: true, where: '"number" IS NOT NULL' })
@Index('IDX_documents_list', ['userId', 'type', 'status'])
@Index('IDX_documents_party', ['userId', 'partyType', 'partyId'])
@Index('IDX_documents_due', ['userId', 'paymentStatus', 'dueDate'])
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  /** Société (propriétaire des données). */
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 30 })
  type: DocumentType;

  /** Numéro légal (FA-2026-00001), attribué à la validation. Null pour un brouillon. */
  @Column({ type: 'varchar', length: 40, nullable: true })
  number: string | null;

  @Column({ type: 'varchar', length: 30, default: 'draft' })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 10, default: 'none' })
  paymentStatus: PaymentStatus;

  // --- Tiers (copie figée au moment de l'émission : la facture ne change pas si la fiche client change) ---
  @Column({ type: 'varchar', length: 10 })
  partyType: 'client' | 'supplier';

  @Column({ type: 'int', nullable: true })
  partyId: number | null;

  @Column({ type: 'varchar', length: 200 })
  partyName: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  partyTaxId: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  partyAddress: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  partyEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  partyPhone: string | null;

  // --- Dates ---
  @Column({ type: 'date' })
  issueDate: string;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  /** Fin de validité d'un devis. */
  @Column({ type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ type: 'varchar', length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  paymentTerms: string | null;

  /** Référence externe : n° de bon de commande du client, ou n° de la facture du fournisseur. */
  @Column({ type: 'varchar', length: 80, nullable: true })
  externalRef: string | null;

  @Column({ type: 'int', nullable: true })
  warehouseId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  footer: string | null;

  /** Référence attribuée par Tunisie TradeNet (El Fatoora) une fois la facture signée et validée ; null = non certifiée. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  ttnReference: string | null;

  @Column({ type: 'timestamp', nullable: true })
  ttnValidatedAt: Date | null;

  // --- Montants (dinars, 3 décimales) ---
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  globalDiscountPct: number;

  @Column({ ...MONEY, default: 0 })
  subtotalHT: number;

  @Column({ ...MONEY, default: 0 })
  discountTotal: number;

  @Column({ ...MONEY, default: 0 })
  totalHT: number;

  @Column({ type: 'jsonb', nullable: true })
  vatBreakdown: Array<{ rate: number; baseHT: number; vatAmount: number }> | null;

  @Column({ ...MONEY, default: 0 })
  totalVat: number;

  @Column({ ...MONEY, default: 0 })
  totalTTC: number;

  @Column({ ...MONEY, default: 0 })
  stampDuty: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  withholdingRate: number;

  @Column({ ...MONEY, default: 0 })
  withholdingAmount: number;

  /** TTC + timbre − retenue à la source : ce que le tiers doit réellement régler. */
  @Column({ ...MONEY, default: 0 })
  netToPay: number;

  @Column({ ...MONEY, default: 0 })
  paidAmount: number;

  @Column({ ...MONEY, default: 0 })
  balanceDue: number;

  // --- Chaînage ---
  /** Documents d'origine (devis -> BL -> facture) : [{ id, type, number }]. */
  @Column({ type: 'jsonb', nullable: true })
  sources: Array<{ id: number; type: string; number: string | null }> | null;

  /** Pour un avoir : la facture corrigée. */
  @Column({ type: 'int', nullable: true })
  creditedDocumentId: number | null;

  /** Le document entraîne-t-il des mouvements de stock ? (false : facture de service, ou déjà livrée par BL) */
  @Column({ default: true })
  affectsStock: boolean;

  // --- Cycle de vie ---
  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  validatedBy: number | null;

  /** Renseigné à la validation : le document est alors figé. */
  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  cancelReason: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
