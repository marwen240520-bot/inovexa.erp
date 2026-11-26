import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export const PROJECT_STATUSES = ['planned', 'active', 'on_hold', 'done', 'cancelled'] as const;
export const TASK_STATUSES = ['todo', 'doing', 'done'] as const;

/** Projet, chantier ou mission : un client, un budget, des dates, des tâches et un avancement. */
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  /** Référence interne (ex. CH-2026-004). */
  @Column({ type: 'varchar', length: 40, nullable: true })
  code: string | null;

  @Column({ nullable: true })
  department: string;

  /** Fiche client de la société, quand le projet est réalisé pour un client enregistré. */
  @Column({ type: 'int', nullable: true })
  clientId: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  clientName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Lieu d'exécution (adresse du chantier, site du client). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  /** Responsable du projet. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  manager: string | null;

  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  budget: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cost: number;

  /** planned | active | on_hold | done | cancelled */
  @Column({ default: 'active' })
  status: string;

  /** Avancement en % : calculé à partir des tâches quand le projet en a, saisi à la main sinon. */
  @Column({ type: 'int', default: 0 })
  progress: number;

  /** low | normal | high */
  @Column({ type: 'varchar', length: 10, nullable: true })
  priority: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Tâche d'un projet (étape d'un chantier, livrable d'une mission). */
@Entity('project_tasks')
@Index('IDX_project_tasks_project', ['userId', 'projectId'])
export class ProjectTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  projectId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  assignee: string | null;

  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  /** todo | doing | done */
  @Column({ type: 'varchar', length: 10, default: 'todo' })
  status: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
