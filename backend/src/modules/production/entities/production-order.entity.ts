import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  orderNumber: string;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ default: 0 })
  completedQuantity: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  /** Produit fini (fiche produit) : à l'avancement, la quantité produite entre en stock. */
  @Column({ type: 'int', nullable: true })
  productId: number | null;

  /** Nomenclature : composants consommés par unité produite [{ productId, quantity }]. */
  @Column({ type: 'jsonb', nullable: true })
  components: Array<{ productId: number; quantity: number }> | null;

  /** Quantité déjà entrée en stock (pour ne comptabiliser que l'avancement nouveau). */
  @Column({ type: 'numeric', precision: 14, scale: 3, default: 0, transformer: numericTransformer })
  stockedQuantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
