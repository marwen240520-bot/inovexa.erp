import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('client_modules')
export class ClientModules {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column({ default: true })
  dashboard: boolean;

  @Column({ default: true })
  products: boolean;

  @Column({ default: true })
  categories: boolean;

  @Column({ default: true })
  stock: boolean;

  @Column({ default: true })
  sales: boolean;

  @Column({ default: true })
  purchases: boolean;

  @Column({ default: true })
  orders: boolean;

  @Column({ default: true })
  clients: boolean;

  @Column({ default: true })
  suppliers: boolean;

  @Column({ default: true })
  invoices: boolean;

  @Column({ default: true })
  hr: boolean;

  @Column({ default: true })
  finance: boolean;

  @Column({ default: true })
  logistics: boolean;

  @Column({ default: true })
  production: boolean;

  @Column({ default: true })
  ai: boolean;

  @Column({ default: true })
  reports: boolean;

  @Column({ default: true })
  analytics: boolean;

  @Column({ default: true })
  profile: boolean;

  @Column({ default: true })
  settings: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
