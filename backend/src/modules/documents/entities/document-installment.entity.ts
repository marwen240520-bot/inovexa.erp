import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Échéance d'un échéancier de paiement : la somme des échéances égale le net à payer. */
@Entity('document_installments')
@Index('IDX_document_installments_doc', ['documentId', 'dueDate'])
export class DocumentInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  documentId: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ ...MONEY })
  amount: number;

  @Column({ ...MONEY, default: 0 })
  paidAmount: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;
}
