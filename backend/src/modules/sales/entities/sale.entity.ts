import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { QTY } from '../../../common/column-transformers';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  productId: number;

  @Column({ nullable: true })
  clientName: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ ...QTY, default: 1 })
  quantity: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: string;

  // Moyen de paiement (caisse rapide) : cash | card | transfer | check | draft | mobile | other
  @Column({ type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  // Document commercial à l'origine de cette ligne (devis/facture…) : null pour une vente saisie directement.
  @Column({ type: 'int', nullable: true })
  documentId: number | null;

  // Caisse : session de caisse et ticket d'origine (null hors caisse).
  @Column({ type: 'int', nullable: true })
  posSessionId: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  ticketNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
