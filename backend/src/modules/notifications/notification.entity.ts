import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
@Index('IDX_notifications_user', ['userId', 'readAt', 'createdAt'])
@Index('UQ_notifications_key', ['userId', 'dedupeKey'], { unique: true })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  /** low_stock | invoice_overdue | quote_expiring | lot_expiring | order_received | credit_limit | system */
  @Column({ type: 'varchar', length: 24 })
  type: string;

  /** info | warning | critical */
  @Column({ type: 'varchar', length: 10, default: 'info' })
  severity: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  /** Lien interne vers la page concernée. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  link: string | null;

  /** Évite les doublons : une même alerte (ex. stock bas du produit 12 aujourd'hui) n'est créée qu'une fois. */
  @Column({ type: 'varchar', length: 120 })
  dedupeKey: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  emailedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
