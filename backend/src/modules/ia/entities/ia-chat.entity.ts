import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ia_chats')
export class IaChat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  role: string;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
