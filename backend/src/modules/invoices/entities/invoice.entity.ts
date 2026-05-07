import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ nullable: true, length: 100 })
  reference: string;

  @Column({ unique: true, nullable: true, length: 50 })
  operationNumber: string;

  @Column({ default: 'debit', length: 20 })
  type: string;

  @Column({ nullable: true, length: 255 })
  clientName: string;

  @Column({ nullable: true, length: 255 })
  supplierName: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column('decimal', { precision: 8, scale: 2, default: 20 })
  taxRate: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ default: 'pending', length: 20 })
  status: string;

  @Column({ nullable: true, type: 'date' })
  dueDate: Date;

  // ⭐ NOUVEAU: Stocker les produits en JSON
  @Column({ type: 'json', nullable: true, default: [] })
  items: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateOperationNumber() {
    if (!this.operationNumber) {
      const year = new Date().getFullYear();
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      this.operationNumber = `INV-${year}${month}-${random}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  calculateAmounts() {
    const subtotal = Number(this.subtotal) || 0;
    const taxRate = Number(this.taxRate) || 20;
    this.taxAmount = (subtotal * taxRate) / 100;
    this.amount = subtotal + this.taxAmount;
  }
}