import { Column, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { QTY } from '../../../common/column-transformers';

/** Quantité d'un produit dans un dépôt. La quantité totale du produit (products.quantity) en est la somme. */
@Entity('stock_levels')
@Index('UQ_stock_levels_product_wh', ['productId', 'warehouseId'], { unique: true })
@Index('IDX_stock_levels_user', ['userId'])
export class StockLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column()
  warehouseId: number;

  @Column({ ...QTY, default: 0 })
  quantity: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
