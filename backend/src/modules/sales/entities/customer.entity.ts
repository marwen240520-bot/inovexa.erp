import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Quote } from './quote.entity';
import { SalesOrder } from './sales-order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  tax_number: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  credit_limit: number;

  @OneToMany(() => Quote, quote => quote.customer)
  quotes: Quote[];

  @OneToMany(() => SalesOrder, order => order.customer)
  orders: SalesOrder[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
