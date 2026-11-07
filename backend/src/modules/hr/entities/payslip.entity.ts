import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Bulletin de paie mensuel (figé une fois validé). Les taux utilisés sont conservés dans `parameters`. */
@Entity('payslips')
@Index('UQ_payslips_period', ['userId', 'employeeId', 'year', 'month'], { unique: true })
export class Payslip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  employeeId: number;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ ...MONEY })
  grossSalary: number;

  @Column({ ...MONEY, default: 0 })
  bonuses: number;

  @Column({ ...MONEY, default: 0 })
  employeeCnss: number;

  @Column({ ...MONEY, default: 0 })
  taxableIncome: number;

  @Column({ ...MONEY, default: 0 })
  incomeTax: number;

  @Column({ ...MONEY, default: 0 })
  solidarityContribution: number;

  @Column({ ...MONEY, default: 0 })
  otherDeductions: number;

  @Column({ ...MONEY })
  netSalary: number;

  @Column({ ...MONEY, default: 0 })
  employerCnss: number;

  @Column({ ...MONEY, default: 0 })
  employerCost: number;

  /** draft | validated | paid */
  @Column({ type: 'varchar', length: 12, default: 'draft' })
  status: string;

  /** Paramètres de paie utilisés pour ce calcul (traçabilité). */
  @Column({ type: 'jsonb', nullable: true })
  parameters: any;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @CreateDateColumn()
  createdAt: Date;
}
