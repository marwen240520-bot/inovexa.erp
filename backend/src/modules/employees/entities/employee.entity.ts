import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  position: string;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  hireDate: string;

  @Column({ default: 'active' })
  status: string;

  // --- Paie ---
  @Column({ type: 'varchar', length: 20, nullable: true })
  cin: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  cnssNumber: string | null;

  // Chef de famille (déduction IRPP).
  @Column({ default: false })
  headOfFamily: boolean;

  @Column({ type: 'int', default: 0 })
  childrenCount: number;

  // CDI | CDD | SIVP | stage
  @Column({ type: 'varchar', length: 12, nullable: true })
  contractType: string | null;

  // Jours de congé payé acquis non pris au démarrage du suivi.
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0, transformer: { to: (v: any) => v, from: (v: any) => (v == null ? v : Number(v)) } })
  leaveBalanceStart: number;

  @Column({ type: 'text', nullable: true })
  createdAt: string;

  @Column({ type: 'text', nullable: true })
  updatedAt: string;
}
