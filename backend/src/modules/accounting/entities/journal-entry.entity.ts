import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Écriture comptable (équilibrée : total débit = total crédit). Jamais modifiée : on contre-passe. */
@Entity('journal_entries')
@Index('IDX_journal_entries_date', ['userId', 'date'])
@Index('IDX_journal_entries_ref', ['userId', 'refType', 'refId'])
@Index('UQ_journal_entries_number', ['userId', 'journal', 'number'], { unique: true })
export class JournalEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  /** VT ventes | AC achats | BQ banque | CA caisse | OD opérations diverses */
  @Column({ type: 'varchar', length: 4 })
  journal: string;

  @Column({ type: 'varchar', length: 30 })
  number: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'varchar', length: 300 })
  label: string;

  /** document | payment | manual | reversal */
  @Column({ type: 'varchar', length: 20, nullable: true })
  refType: string | null;

  @Column({ type: 'int', nullable: true })
  refId: number | null;

  @Column({ ...MONEY, default: 0 })
  totalDebit: number;

  @Column({ ...MONEY, default: 0 })
  totalCredit: number;

  /** Écriture annulée par une contre-passation. */
  @Column({ type: 'int', nullable: true })
  reversedBy: number | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
