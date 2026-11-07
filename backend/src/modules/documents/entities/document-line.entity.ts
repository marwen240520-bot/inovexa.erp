import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY, QTY, numericTransformer } from '../../../common/column-transformers';

@Entity('document_lines')
@Index('IDX_document_lines_doc', ['documentId', 'position'])
@Index('IDX_document_lines_product', ['productId'])
export class DocumentLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  documentId: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ ...QTY })
  quantity: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string | null;

  @Column({ ...MONEY })
  unitPriceHT: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0, transformer: numericTransformer })
  discountPct: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19, transformer: numericTransformer })
  vatRate: number;

  // Montants calculés (HT après remises, TVA, TTC)
  @Column({ ...MONEY, default: 0 })
  netHT: number;

  @Column({ ...MONEY, default: 0 })
  vatAmount: number;

  @Column({ ...MONEY, default: 0 })
  totalTTC: number;

  /** Coût moyen au moment de la sortie de stock : sert à calculer la marge réelle du document. */
  @Column({ ...MONEY, nullable: true })
  unitCost: number | null;

  /** Quantité déjà livrée (BL), reçue (réception) ou facturée, selon le type de document. */
  @Column({ ...QTY, default: 0 })
  processedQty: number;

  @Column({ type: 'varchar', length: 60, nullable: true })
  lotNumber: string | null;

  @Column({ type: 'date', nullable: true })
  expiryDate: string | null;

  @Column({ type: 'int', nullable: true })
  warehouseId: number | null;

  /** Avoir : la marchandise retourne-t-elle en stock ? */
  @Column({ default: true })
  returnToStock: boolean;

  /** Ligne du document d'origine (pour le suivi quantité livrée / facturée). */
  @Column({ type: 'int', nullable: true })
  sourceLineId: number | null;
}
