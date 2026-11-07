import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY, QTY } from '../../../common/column-transformers';

export type MovementType = 'opening' | 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out';

/**
 * Journal des mouvements de stock. Une ligne n'est jamais modifiée ni supprimée : une erreur se corrige
 * par un mouvement inverse ou un ajustement, avec son motif et son auteur.
 */
@Entity('stock_movements')
@Index('IDX_stock_movements_product', ['userId', 'productId', 'createdAt'])
@Index('IDX_stock_movements_ref', ['userId', 'refType', 'refId'])
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column()
  warehouseId: number;

  @Column({ type: 'varchar', length: 20 })
  type: MovementType;

  /** sale | purchase | delivery | receipt | return | manual | inventory | transfer | production | loss | opening | pos … */
  @Column({ type: 'varchar', length: 30 })
  reason: string;

  /** Quantité SIGNÉE (+ entrée, − sortie). */
  @Column({ ...QTY })
  quantity: number;

  /** Coût unitaire (CMUP) appliqué à ce mouvement. */
  @Column({ ...MONEY, default: 0 })
  unitCost: number;

  /** Solde du dépôt après le mouvement. */
  @Column({ ...QTY, default: 0 })
  balanceAfter: number;

  /** Solde total du produit (tous dépôts) après le mouvement. */
  @Column({ ...QTY, default: 0 })
  totalAfter: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  refType: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  refId: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  lotNumber: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
