import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('quality_controls')
export class QualityControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  work_order_id: string;

  @Column()
  product_id: string;

  @Column({ type: 'date' })
  inspection_date: Date;

  @Column()
  inspector_id: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'json', nullable: true })
  checkpoints: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
