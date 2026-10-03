import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  // Moyen de paiement (caisse rapide) : cash | card | transfer | check | draft | mobile | other
  @Column({ type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
