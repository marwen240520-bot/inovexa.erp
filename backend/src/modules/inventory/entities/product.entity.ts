import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { Stock } from './stock.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  barcode: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  category_id: string;

  @ManyToOne(() => Category)
  category: Category;

  @Column({ type: 'varchar', length: 20, default: 'pcs' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  purchase_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  selling_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  vat_rate: number;

  @Column({ type: 'text', nullable: true })
  image_url: string;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => Stock, stock => stock.product)
  stocks: Stock[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
