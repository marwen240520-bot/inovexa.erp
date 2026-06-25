import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'json', nullable: true, default: {} })
  modules: Record<string, boolean>;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEnd: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
