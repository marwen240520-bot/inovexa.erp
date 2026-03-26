import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  // ========== GESTION D'ABONNEMENT ==========
  @Column({ default: 'active' })
  subscriptionStatus: string; // active, paused, expired, cancelled

  @Column({ nullable: true })
  subscriptionStartDate: Date;

  @Column({ nullable: true })
  subscriptionEndDate: Date;

  @Column({ nullable: true })
  subscriptionPlan: string; // basic, pro, enterprise

  @Column({ nullable: true })
  lastPaymentDate: Date;

  @Column({ nullable: true })
  nextPaymentDate: Date;

  @Column({ nullable: true })
  paymentMethod: string; // card, bank_transfer, cash

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  companyMatricule: string; // Matricule fiscal tunisien

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 0 })
  warningSent: number; // 0 = pas de warning, 1 = warning à 7 jours, 2 = warning à 3 jours

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
