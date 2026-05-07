import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  salary: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  hireDate: Date;

  @Column({ default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}