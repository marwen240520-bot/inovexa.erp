import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @Column()
  user_email: string;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ nullable: true, type: 'json' })
  old_data: any;

  @Column({ nullable: true, type: 'json' })
  new_data: any;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;
}
