import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../common/column-transformers';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  contact: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  totalPurchases: number;

  @Column({ default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  taxId: string | null;

  @Column({ type: 'int', nullable: true })
  paymentTermsDays: number | null;

  // RIB / IBAN du fournisseur pour les virements.
  @Column({ type: 'varchar', length: 60, nullable: true })
  bankAccount: string | null;

  // Retenue à la source que nous appliquons habituellement à ce fournisseur, en %.
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  withholdingRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
