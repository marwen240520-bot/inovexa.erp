import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

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

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  totalSpent: number;

  @Column({ default: 'active' })
  status: string;

  // Matricule fiscal (ou CIN d'un particulier) : mention obligatoire des factures entre professionnels.
  @Column({ type: 'varchar', length: 40, nullable: true })
  taxId: string | null;

  // Délai de paiement accordé, en jours (null = délai par défaut de la société).
  @Column({ type: 'int', nullable: true })
  paymentTermsDays: number | null;

  // Plafond d'encours : alerte si les factures impayées le dépassent (null = illimité).
  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true, transformer: numericTransformer })
  creditLimit: number | null;

  // Remise habituelle appliquée à ses documents, en %.
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  discountPct: number;

  // Liste de prix dédiée (null = prix du catalogue).
  @Column({ type: 'int', nullable: true })
  priceListId: number | null;

  // Retenue à la source que ce client pratique habituellement, en %.
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  withholdingRate: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
