import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ unique: true })
  operationNumber: string;

  @Column()
  reference: string;

  @Column({ default: 'debit' })
  type: string;

  @Column({ nullable: true, type: 'int' })
  clientId: number | null;

  @Column({ nullable: true, type: 'int' })
  supplierId: number | null;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  supplierName: string;

  @Column({ nullable: true })
  clientEmail: string;

  @Column({ nullable: true })
  clientAddress: string;

  @Column({ nullable: true })
  clientPhone: string;

  @Column({ nullable: true })
  clientSiret: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  items: any[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotalHT: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 20 })
  taxRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date | null;

  @Column({ default: 'Net 30' })
  paymentTerms: string;

  // Moyen de paiement : cash | card | transfer | check | draft | mobile | other
  @Column({ type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}