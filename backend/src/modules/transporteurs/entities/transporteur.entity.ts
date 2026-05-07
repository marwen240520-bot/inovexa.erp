import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transporteurs')
export class Transporteur {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  clientId: number;

  @Column({ nullable: true })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ nullable: true, length: 50 })
  phone: string;

  @Column({ nullable: true, length: 255 })
  companyName: string;

  @Column({ nullable: true, length: 500 })
  address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}