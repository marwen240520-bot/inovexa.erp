import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column({ nullable: true })
  transporteurId: number;

  @Column({ unique: true })
  trackingNumber: string;

  @Column()
  clientName: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  carrier: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  estimatedDelivery: Date;

  // ⭐ NOUVEAU : Montant de la livraison
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  // ⭐ NOUVEAU : Téléphone du client
  @Column({ nullable: true, length: 50 })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}