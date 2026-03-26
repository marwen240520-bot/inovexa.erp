import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  trigger: string; // new_order, low_stock, invoice_due, new_customer, etc.

  @Column({ nullable: true, type: 'json' })
  triggerConfig: any;

  @Column()
  action: string; // send_email, create_invoice, update_stock, send_notification, etc.

  @Column({ nullable: true, type: 'json' })
  actionConfig: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
