import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { QTY } from '../../../common/column-transformers';

/** Lot (ou numéro de série) d'un produit dans un dépôt, avec sa date de péremption. */
@Entity('stock_lots')
@Index('UQ_stock_lots_scope', ['productId', 'warehouseId', 'lotNumber'], { unique: true })
@Index('IDX_stock_lots_expiry', ['userId', 'expiryDate'])
export class StockLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column()
  warehouseId: number;

  @Column({ type: 'varchar', length: 60 })
  lotNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ ...QTY, default: 0 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
