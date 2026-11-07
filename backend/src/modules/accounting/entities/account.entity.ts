import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Compte personnalisé ajouté par la société au plan comptable de base (le plan de base est dans le code). */
@Entity('accounts')
@Index('UQ_accounts_code', ['userId', 'code'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  /** asset | liability | equity | income | expense */
  @Column({ type: 'varchar', length: 12 })
  type: string;

  @Column({ default: true })
  active: boolean;
}
