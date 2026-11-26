import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Rapport enregistré par une société (auparavant gardé dans la mémoire du serveur, donc perdu à chaque redémarrage). */
@Entity('saved_reports')
@Index('IDX_saved_reports_user', ['userId', 'createdAt'])
export class SavedReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  /** sales | purchases | clients | products | employees | inventory | logistics | … */
  @Column({ type: 'varchar', length: 40 })
  type: string;

  /** Contenu du rapport au moment de l'enregistrement (lignes, totaux, période). */
  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
