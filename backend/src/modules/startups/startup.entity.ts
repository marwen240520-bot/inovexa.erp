import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('startups')
export class Startup {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column() name: string;
  @Column() industry: string;
  @Column() employees: number;
  @Column() funding: number;
  @Column() website: string;
  @CreateDateColumn() createdAt: Date;
}
