import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  position: string;

  @Column('decimal', { precision: 10, scale: 2 })
  salary: number;

  @CreateDateColumn()
  createdAt: Date;
}
