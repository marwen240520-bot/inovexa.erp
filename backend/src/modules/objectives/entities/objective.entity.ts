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

  // Indicateurs automatiques : revenue | profit | sales_count | new_clients | orders_count | purchases_count |
  //   invoices_paid_amount | invoices_paid_count | shipments_delivered | average_basket
  // Objectif libre (progression saisie à la main) : manual
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

  // Objectif libre : valeur actuelle mise à jour par l'utilisateur (ignorée pour les indicateurs automatiques)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0, transformer: { to: (v: number) => v, from: (v: string | null) => (v === null || v === undefined ? v : parseFloat(v)) } })
  currentValue: number;

  // Unité affichée pour un objectif libre (ex. « recrutements », « % »)
  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
