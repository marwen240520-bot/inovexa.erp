import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MONEY } from '../../../common/column-transformers';

/** Liste de prix (tarif revendeur, grossiste…) affectable à un client. */
@Entity('price_lists')
export class PriceList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('price_list_items')
@Index('UQ_price_list_items', ['priceListId', 'productId'], { unique: true })
export class PriceListItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  priceListId: number;

  @Column()
  productId: number;

  /** Prix unitaire HT pour cette liste. */
  @Column({ ...MONEY })
  price: number;
}
