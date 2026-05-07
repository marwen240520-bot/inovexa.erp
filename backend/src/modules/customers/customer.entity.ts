import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;
}
