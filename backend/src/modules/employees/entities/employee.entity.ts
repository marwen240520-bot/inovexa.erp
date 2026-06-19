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

  @Column({ type: 'text', nullable: true })
  createdAt: string;

  @Column({ type: 'text', nullable: true })
  updatedAt: string;
}
