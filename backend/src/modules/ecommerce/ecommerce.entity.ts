import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ecommerce')
export class Ecommerce {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column() name: string;
  @Column() platform: string;
  @Column() url: string;
  @Column() monthlyOrders: number;
  @Column() averageOrder: number;
  @CreateDateColumn() createdAt: Date;
}
