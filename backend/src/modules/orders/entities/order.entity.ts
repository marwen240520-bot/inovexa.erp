import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  // Colonnes héritées de l'ancienne entité (liens ajoutés en base par scripts/correction.sql) :
  // conservées pour que la synchronisation ne les supprime jamais.
  @Column({ nullable: true })
  clientId: number;

  @Column({ nullable: true })
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
