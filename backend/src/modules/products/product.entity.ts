import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { MONEY, QTY, numericTransformer } from '../../common/column-transformers';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: 1 })
  userId: number;

  @Column({ nullable: true })
  categoryId: number;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  // Stock total (somme des dépôts). Tenu à jour UNIQUEMENT par le module Stock (journal des mouvements).
  @Column({ ...QTY, default: 0 })
  quantity: number;

  // Seuil d'alerte de stock bas, propre à chaque produit.
  @Column({ type: 'int', default: 10 })
  minStock: number;

  // Coût moyen unitaire pondéré (CMUP), calculé à chaque entrée en stock.
  @Column({ ...MONEY, default: 0 })
  avgCost: number;

  // Unité de vente : pièce, kg, m, l, boîte…
  @Column({ type: 'varchar', length: 20, default: 'pièce' })
  unit: string;

  // Taux de TVA appliqué par défaut sur les documents.
  @Column({ type: 'numeric', precision: 5, scale: 2, default: 19, transformer: numericTransformer })
  vatRate: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  barcode: string | null;

  // false = service (pas de mouvement de stock).
  @Column({ default: true })
  isStockable: boolean;

  // true = suivi par lot / date de péremption (sorties en FEFO : premier périmé, premier sorti).
  @Column({ default: false })
  trackLots: boolean;

  // Photo du produit : image réduite encodée en « data URL » (data:image/jpeg;base64,...) ou lien http(s).
  // Stockée en base : le disque de l'hébergeur est effacé à chaque déploiement.
  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
