import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  type: string;

  // numericTransformer : le solde revient en nombre (« 100.00 » en texte se concaténait au lieu de s'additionner).
  @Column('decimal', { precision: 10, scale: 2, default: 0, transformer: numericTransformer })
  balance: number;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  iban: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
