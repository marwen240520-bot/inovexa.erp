import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Ligne d'un relevé bancaire importé, à rapprocher d'un règlement enregistré dans l'ERP. */
@Entity('bank_statement_lines')
@Index('IDX_bank_statement_lines_scope', ['userId', 'bankAccountId', 'date'])
export class BankStatementLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  bankAccountId: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 300 })
  label: string;

  /** Signé : + crédit (encaissement), − débit (décaissement). */
  @Column({ ...MONEY })
  amount: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  reference: string | null;

  /** unmatched | matched | ignored */
  @Column({ type: 'varchar', length: 12, default: 'unmatched' })
  status: string;

  @Column({ type: 'int', nullable: true })
  matchedPaymentId: number | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  importBatch: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
