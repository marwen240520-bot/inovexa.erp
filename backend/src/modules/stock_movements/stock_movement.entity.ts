import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  productId: string;
  @Column()
  productName: string;
  @Column()
  type: string;
  @Column()
  quantity: number;
  @Column({ nullable: true })
  reason: string;
  @CreateDateColumn()
  createdAt: Date;
}
