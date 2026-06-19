import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  orderNumber: string;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({ default: 0 })
  completedQuantity: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ nullable: true })
  priority: string;

  @Column({ nullable: true })
  assignedTo: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
