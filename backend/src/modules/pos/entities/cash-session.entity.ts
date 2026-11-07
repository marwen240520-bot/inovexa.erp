import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Session de caisse : ouverture avec fond de caisse, clôture avec rapport Z (totaux par moyen de paiement, écart). */
@Entity('cash_sessions')
@Index('IDX_cash_sessions_user', ['userId', 'status', 'openedAt'])
export class CashSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  number: string | null;

  /** open | closed */
  @Column({ type: 'varchar', length: 8, default: 'open' })
  status: string;

  @Column({ type: 'timestamp' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ ...MONEY, default: 0 })
  openingFloat: number;

  /** Espèces comptées à la clôture. */
  @Column({ ...MONEY, nullable: true })
  countedCash: number | null;

  /** Espèces attendues = fond de caisse + ventes en espèces − achats en espèces. */
  @Column({ ...MONEY, nullable: true })
  expectedCash: number | null;

  @Column({ ...MONEY, nullable: true })
  variance: number | null;

  /** Rapport Z figé à la clôture. */
  @Column({ type: 'jsonb', nullable: true })
  report: any;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  openedBy: number | null;

  @Column({ type: 'int', nullable: true })
  closedBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
