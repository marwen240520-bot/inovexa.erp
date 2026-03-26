import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('performance_reviews')
export class PerformanceReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @Column()
  reviewerId: string;

  @Column()
  reviewerName: string;

  @Column()
  period: string; // Q1, Q2, Q3, Q4, annual

  @Column()
  year: number;

  @Column('decimal', { precision: 3, scale: 1 })
  rating: number; // 1-5

  @Column({ nullable: true, type: 'text' })
  strengths: string;

  @Column({ nullable: true, type: 'text' })
  improvements: string;

  @Column({ nullable: true, type: 'text' })
  goals: string;

  @Column({ nullable: true })
  status: string; // draft, submitted, approved

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @CreateDateColumn()
  createdAt: Date;
}
