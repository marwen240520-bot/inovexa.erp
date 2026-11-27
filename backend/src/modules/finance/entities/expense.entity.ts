import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  // Décimal(10,2) : c'est le type réel de la colonne en base. Le transformer renvoie un nombre (et non une chaîne).
  @Column('decimal', { precision: 10, scale: 2, transformer: { to: (v: number) => v, from: (v: string | null) => (v === null || v === undefined ? v : parseFloat(v)) } })
  amount: number;

  // Montant HT, TVA et taux : décimaux (ils étaient des entiers : une dépense de 84,034 DT HT était refusée).
  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numericTransformer })
  amountHT: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: numericTransformer })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: numericTransformer })
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
