import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

@Entity('journal_lines')
@Index('IDX_journal_lines_entry', ['entryId'])
@Index('IDX_journal_lines_account', ['userId', 'accountCode'])
export class JournalLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entryId: number;

  /** Dupliqué depuis l'écriture pour les rapports (grand livre, balance) sans jointure. */
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  accountCode: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  label: string | null;

  @Column({ ...MONEY, default: 0 })
  debit: number;

  @Column({ ...MONEY, default: 0 })
  credit: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  partyType: string | null;

  @Column({ type: 'int', nullable: true })
  partyId: number | null;
}
