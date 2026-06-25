import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
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

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;
}
