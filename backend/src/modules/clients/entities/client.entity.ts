import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  // ⭐ AJOUTER ces colonnes manquantes
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}