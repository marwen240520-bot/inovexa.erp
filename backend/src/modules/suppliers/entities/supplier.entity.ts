import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  contact: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  totalPurchases: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
