import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column() name: string;
  @Column() cuisine: string;
  @Column() capacity: number;
  @Column() address: string;
  @Column() phone: string;
  @CreateDateColumn() createdAt: Date;
}
