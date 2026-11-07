import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QTY } from '../../../common/column-transformers';
import { Product } from '../../products/product.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: false })
  productId: number;

  @Column({ nullable: true })
  productName: string;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ ...QTY, default: 1 })
  quantity: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  // Document commercial à l'origine de cette ligne (bon de réception…) : null pour un achat saisi directement.
  @Column({ type: 'int', nullable: true })
  documentId: number | null;

  // Caisse : session de caisse et ticket d'origine (null hors caisse).
  @Column({ type: 'int', nullable: true })
  posSessionId: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  ticketNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
