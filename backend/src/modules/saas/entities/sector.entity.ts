import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from '../../../common/column-transformers';

const PRICE = { type: 'numeric' as const, precision: 12, scale: 3, transformer: numericTransformer };

/**
 * Secteur d'activité : modules de l'ERP proposés par défaut, conseils, et catalogue de SUGGESTIONS (catégories, produits,
 * prestations). Ce catalogue appartient à la plateforme : il n'est jamais mélangé avec le stock d'une société. Une société
 * copie les suggestions qui l'intéressent dans SES produits, puis les modifie librement.
 */
@Entity('sectors')
@Index('UQ_sectors_code', ['code'], { unique: true })
export class Sector {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nameEn: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nameAr: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  /** Modules activés par défaut pour une société de ce secteur (clés de MODULE_KEYS). */
  @Column({ type: 'jsonb', nullable: true })
  modules: string[] | null;

  /** Conseils de mise en route propres au secteur. */
  @Column({ type: 'jsonb', nullable: true })
  recommendations: string[] | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/** Catégorie (ou sous-catégorie, via parentId) du catalogue de suggestions d'un secteur. */
@Entity('sector_categories')
@Index('IDX_sector_categories_sector', ['sectorId', 'sortOrder'])
export class SectorCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sectorId: number;

  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}

/**
 * Suggestion de produit ou de prestation. Tous les montants sont INDICATIFS : `basis` dit d'où vient le chiffre
 * (exemple de marge, estimation à ajuster…). Ce ne sont pas des prix de marché.
 */
@Entity('sector_items')
@Index('IDX_sector_items_sector', ['sectorId', 'categoryId', 'sortOrder'])
export class SectorItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sectorId: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  /** product = article stocké ; service = prestation facturée (pas de stock). */
  @Column({ type: 'varchar', length: 10, default: 'product' })
  kind: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pièce' })
  unit: string;

  /** Coût d'achat indicatif, hors taxes. */
  @Column({ ...PRICE, nullable: true })
  purchasePrice: number | null;

  /** Prix de vente indicatif, hors taxes. */
  @Column({ ...PRICE, nullable: true })
  sellingPrice: number | null;

  /** Marge indicative sur le coût d'achat, en %. */
  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true, transformer: numericTransformer })
  marginPct: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: numericTransformer })
  vatRate: number | null;

  /** Suivi par lot / date de péremption conseillé (pharmacie, alimentaire…). */
  @Column({ default: false })
  trackLots: boolean;

  /** D'où vient le montant proposé — affiché à côté du prix. */
  @Column({ type: 'varchar', length: 300, nullable: true })
  basis: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Prestation de l'éditeur (mise en service, formation, reprise de données, support…) : affichée sur la page Tarifs,
 * SÉPARÉMENT de l'abonnement. price = null → « sur devis ».
 */
@Entity('service_offers')
@Index('IDX_service_offers_sector', ['sectorCode', 'sortOrder'])
export class ServiceOffer {
  @PrimaryGeneratedColumn()
  id: number;

  /** null = toutes activités. */
  @Column({ type: 'varchar', length: 40, nullable: true })
  sectorCode: string | null;

  /** setup | training | migration | support | module */
  @Column({ type: 'varchar', length: 20, default: 'setup' })
  category: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  description: string | null;

  @Column({ ...PRICE, nullable: true })
  price: number | null;

  /** one_time | per_month | per_day | per_hour | per_user */
  @Column({ type: 'varchar', length: 12, default: 'one_time' })
  priceUnit: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  basis: string | null;

  /** false = brouillon, non affiché sur le site. */
  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
