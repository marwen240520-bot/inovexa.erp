import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  customerName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountHT: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tva: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amountTTC: number;

  @Column({ default: 'pending' })
  status: string;

  @ManyToOne(() => Customer, customer => customer.invoices)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
