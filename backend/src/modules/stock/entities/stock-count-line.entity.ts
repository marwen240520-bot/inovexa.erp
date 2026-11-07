import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY, QTY } from '../../../common/column-transformers';

@Entity('stock_count_lines')
@Index('IDX_stock_count_lines_count', ['countId'])
export class StockCountLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  countId: number;

  @Column()
  productId: number;

  /** Quantité théorique au moment où l'inventaire a été ouvert. */
  @Column({ ...QTY, default: 0 })
  expectedQty: number;

  /** Quantité réellement comptée (null tant que la ligne n'a pas été comptée). */
  @Column({ ...QTY, nullable: true })
  countedQty: number | null;

  @Column({ ...MONEY, default: 0 })
  unitCost: number;
}
