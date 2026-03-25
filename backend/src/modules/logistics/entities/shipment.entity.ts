import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  shipment_number: string;

  @Column({ nullable: true })
  order_id: string;

  @Column({ nullable: true })
  carrier_id: string;

  @Column({ nullable: true })
  tracking_number: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'date', nullable: true })
  shipped_date: Date;

  @Column({ type: 'date', nullable: true })
  delivered_date: Date;

  @Column({ type: 'text', nullable: true })
  address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
