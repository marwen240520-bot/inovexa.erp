import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  // Décimal(10,2) : c'est le type réel de la colonne en base. Le transformer renvoie un nombre (et non une chaîne).
  @Column('decimal', { precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string | null) => (v === null || v === undefined ? v : parseFloat(v)) } })
  amount: number;

  @Column()
  amountHT: number;

  @Column()
  taxAmount: number;

  @Column()
  taxRate: number;

  @Column()
  category: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  vendor: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
