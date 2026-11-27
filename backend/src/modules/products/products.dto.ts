import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Amount, Flag, Text } from '../../common/dto';

export class CreateProductDto {
  @Text({ label: 'Nom', required: true, max: 160 }) name: string;
  @IsOptional() @Text({ label: 'Référence (SKU)', max: 80 }) sku?: string;
  /** Prix de vente. Le service lit aussi « 1 200,50 € » : le DTO accepte les mêmes saisies et refuse les valeurs illisibles. */
  @IsOptional() @Amount({ label: 'Prix' }) price?: number;
  /** Stock initial (le stock ensuite ne bouge plus que par les mouvements). */
  @IsOptional() @Amount({ label: 'Quantité', max: 99_999_999_999.999 }) quantity?: number;
  @IsOptional() @Amount({ label: 'Catégorie', int: true, min: 1, max: 2_147_483_647 }) categoryId?: number | null;
  @IsOptional() @Text({ label: 'Image', max: 2_000_000 }) imageUrl?: string | null;
  /** Les taux admis dépendent de la société : le service contrôle la liste exacte. */
  @IsOptional() @Amount({ label: 'TVA (%)', max: 100 }) vatRate?: number;
  @IsOptional() @Amount({ label: 'Seuil d’alerte', max: 1_000_000_000 }) minStock?: number;
  @IsOptional() @Text({ label: 'Unité', max: 20 }) unit?: string;
  @IsOptional() @Text({ label: 'Code-barres', max: 64 }) barcode?: string | null;
  @IsOptional() @Flag('Stockable') isStockable?: boolean;
  @IsOptional() @Flag('Suivi par lot') trackLots?: boolean;
  /** Prix d'achat : coût initial du stock. */
  @IsOptional() @Amount({ label: 'Prix d’achat' }) costPrice?: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
