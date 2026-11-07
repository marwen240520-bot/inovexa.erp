import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Journal d'audit : qui a fait quoi, quand, depuis où. Les lignes ne sont jamais modifiées ni supprimées par l'application.
 */
@Entity('audit_logs')
@Index('IDX_audit_logs_user_date', ['userId', 'createdAt'])
@Index('IDX_audit_logs_entity', ['userId', 'entity', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** Société (propriétaire des données). */
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  /** Personne connectée qui a agi (peut différer de userId pour un membre d'équipe). */
  @Column({ type: 'int', nullable: true })
  actorId: number | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  actorEmail: string | null;

  /** create | update | delete | validate | pay | cancel | login | … */
  @Column({ type: 'varchar', length: 40 })
  action: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  entity: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  path: string | null;

  @Column({ type: 'int', nullable: true })
  status: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  userAgent: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs: number | null;

  /** Données utiles (corps de la requête sans secrets, ancien/nouveau état…), tronquées. */
  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @CreateDateColumn()
  createdAt: Date;
}
