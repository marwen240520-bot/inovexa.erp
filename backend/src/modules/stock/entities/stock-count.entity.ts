import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Inventaire physique d'un dépôt : brouillon -> comptage -> validation (génère les ajustements). */
@Entity('stock_counts')
@Index('IDX_stock_counts_user', ['userId', 'status'])
export class StockCount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 40, nullable: true })
  number: string | null;

  @Column()
  warehouseId: number;

  /** draft | counting | validated | cancelled */
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
