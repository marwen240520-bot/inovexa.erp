import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity('customer_interactions')
export class CustomerInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  type: string; // call, email, meeting, note, quote, order

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;
}
