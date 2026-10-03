import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** Un objectif chiffré sur une période (ex. « 50 000 € de chiffre d'affaires ce trimestre »). */
@Entity('objectives')
export class Objective {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  // revenue | profit | sales_count | new_clients
  @Column({ type: 'varchar', length: 30 })
  metric: string;

  // month | quarter | year | custom
  @Column({ type: 'varchar', length: 20, default: 'month' })
  period: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, transformer: { to: (v: number) => v, from: (v: string | null) => (v === null || v === undefined ? v : parseFloat(v)) } })
  targetValue: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
