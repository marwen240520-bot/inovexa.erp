import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('module_configurations')
export class ModuleConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  moduleName: string; // finance, stock, sales, hr, logistics, ai

  @Column({ default: true })
  isEnabled: boolean;

  @Column({ nullable: true, type: 'json' })
  settings: any;

  @Column({ nullable: true })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
