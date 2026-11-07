import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Compteur de numérotation légale : un compteur par société (userId), par type de pièce et par année.
 * Incrémenté dans la MÊME transaction que la validation du document : si la validation échoue, le numéro
 * n'est pas consommé -> la suite est continue, sans trou.
 */
@Entity('number_sequences')
@Index('UQ_number_sequences_scope', ['userId', 'key', 'year'], { unique: true })
export class NumberSequence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 40 })
  key: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int', default: 0 })
  lastValue: number;
}
