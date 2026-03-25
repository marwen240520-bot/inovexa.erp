import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  order_number: string;

  @Column()
  product_id: string;

  @Column()
  bom_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  quantity_planned: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  quantity_produced: number;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ default: 'planned' })
  status: string;

  @Column({ nullable: true })
  priority: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
