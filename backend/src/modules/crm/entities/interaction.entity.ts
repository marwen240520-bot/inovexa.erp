import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Historique des échanges avec un client ou un fournisseur (appels, emails, rendez-vous, relances). */
@Entity('crm_interactions')
@Index('IDX_crm_interactions_party', ['userId', 'partyType', 'partyId', 'createdAt'])
export class Interaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 10, default: 'client' })
  partyType: 'client' | 'supplier';

  @Column()
  partyId: number;

  /** call | email | meeting | note | reminder | visit */
  @Column({ type: 'varchar', length: 12 })
  kind: string;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  /** Pour une relance : le document concerné et son niveau (1 = amiable, 2 = ferme, 3 = mise en demeure). */
  @Column({ type: 'int', nullable: true })
  documentId: number | null;

  @Column({ type: 'int', nullable: true })
  level: number | null;

  /** Prochaine action à mener et sa date. */
  @Column({ type: 'date', nullable: true })
  followUpDate: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
