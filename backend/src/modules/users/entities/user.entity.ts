import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  companyName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'client' })
  role: string;

  @Column({ type: 'text', nullable: true })
  subscriptionStart: string;

  @Column({ type: 'text', nullable: true })
  subscriptionEnd: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  modules: string;

  @Column({ type: 'text', nullable: true })
  theme: string;

  @Column({ type: 'text', nullable: true })
  profileImage: string;

  @Column({ type: 'text', nullable: true })
  hireDate: string;

  @Column({ type: 'text', nullable: true })
  createdAt: string;

  @Column({ type: 'text', nullable: true })
  updatedAt: string;
}
