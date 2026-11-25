import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Le numéro de suivi est unique dans une société, pas sur toute la plateforme.
@Entity('shipments')
@Index('UQ_shipments_client_tracking', ['clientId', 'trackingNumber'], { unique: true })
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column({ nullable: true })
  transporteurId: number;

  @Column()
  trackingNumber: string;

  @Column()
  clientName: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  carrier: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  estimatedDelivery: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}