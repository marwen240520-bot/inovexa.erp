import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

export const APPOINTMENT_STATUSES = ['scheduled', 'confirmed', 'done', 'cancelled', 'no_show'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Rendez-vous, réservation ou séance : un créneau horaire pour un client, éventuellement rattaché à une ressource
 * (praticien, coiffeuse, salle, table, pont d'atelier…). Le même module sert au cabinet, au salon, au garage,
 * au restaurant (réservations de tables) et au centre de formation (séances).
 */
@Entity('appointments')
@Index('IDX_appointments_user_start', ['userId', 'startAt'])
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  /** Société propriétaire. */
  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  /** Fiche client de la société, quand le rendez-vous est pris pour un client déjà enregistré. */
  @Column({ type: 'int', nullable: true })
  clientId: number | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  clientName: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  clientPhone: string | null;

  /** Prestation prévue (consultation, coupe, vidange, table de 4…). */
  @Column({ type: 'varchar', length: 160, nullable: true })
  service: string | null;

  /** Ressource occupée : deux rendez-vous ne peuvent pas se chevaucher sur la même ressource. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  resource: string | null;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  /** scheduled | confirmed | done | cancelled | no_show */
  @Column({ type: 'varchar', length: 12, default: 'scheduled' })
  status: string;

  /** Nombre de personnes (couverts d'une réservation, participants d'une séance). */
  @Column({ type: 'int', nullable: true })
  partySize: number | null;

  /** Montant prévu de la prestation (indicatif : la facturation se fait dans Ventes ou Factures). */
  @Column({ type: 'numeric', precision: 14, scale: 3, nullable: true, transformer: numericTransformer })
  price: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
