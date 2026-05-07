import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  clientId: number;

  @Column({ nullable: true })
  clientName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
