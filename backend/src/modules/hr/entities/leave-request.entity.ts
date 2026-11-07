import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { QTY } from '../../../common/column-transformers';

@Entity('leave_requests')
@Index('IDX_leave_requests_employee', ['userId', 'employeeId', 'startDate'])
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  employeeId: number;

  /** paid | sick | unpaid | maternity | other */
  @Column({ type: 'varchar', length: 12 })
  kind: string;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  /** Jours ouvrés décomptés. */
  @Column({ ...QTY })
  days: number;

  /** pending | approved | rejected | cancelled */
  @Column({ type: 'varchar', length: 12, default: 'pending' })
  status: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  reason: string | null;

  @Column({ type: 'int', nullable: true })
  decidedBy: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
