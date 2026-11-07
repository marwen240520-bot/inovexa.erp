import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'check', 'draft', 'mobile', 'credit_note', 'other'] as const;

/**
 * Règlement (acompte, paiement partiel ou solde) rattaché à une facture client ou fournisseur.
 * Un règlement n'est jamais supprimé : on l'annule (`voidedAt`) et l'écriture comptable est contre-passée.
 */
@Entity('payments')
@Index('IDX_payments_document', ['documentId'])
@Index('IDX_payments_user_date', ['userId', 'date'])
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  documentId: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  number: string | null;

  /** client = encaissement ; supplier = décaissement. */
  @Column({ type: 'varchar', length: 10 })
  partyType: 'client' | 'supplier';

  @Column({ ...MONEY })
  amount: number;

  @Column({ type: 'varchar', length: 20 })
  method: string;

  @Column({ type: 'date' })
  date: string;

  /** N° de chèque, de virement, de traite… */
  @Column({ type: 'varchar', length: 80, nullable: true })
  reference: string | null;

  @Column({ type: 'int', nullable: true })
  bankAccountId: number | null;

  /** Avoir imputé sur la facture (méthode `credit_note`). */
  @Column({ type: 'int', nullable: true })
  creditNoteId: number | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ type: 'timestamp', nullable: true })
  voidedAt: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  voidReason: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
