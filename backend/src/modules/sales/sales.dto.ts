import { IsOptional } from 'class-validator';
import { Amount, OneOf, Text } from '../../common/dto';

/** pending / paid : ceux du site ; completed : ventes de la caisse et des imports ; cancelled : annulée. */
export const SALE_STATUSES = ['pending', 'paid', 'completed', 'cancelled'] as const;

export class CreateSaleDto {
  /** Obligatoire : sans lui, la recherche du produit prenait le premier produit du compte. */
  @Amount({ label: 'Produit', int: true, min: 1, max: 2_147_483_647 }) productId: number;
  @Amount({ label: 'Quantité', min: 0.001, max: 99_999_999_999.999 }) quantity: number;
  @IsOptional() @Amount({ label: 'Prix unitaire' }) unitPrice?: number;
  @IsOptional() @Text({ label: 'Client', max: 160 }) clientName?: string;
  @IsOptional() @Text({ label: 'Produit', max: 160 }) productName?: string;
  @IsOptional() @OneOf(SALE_STATUSES, 'Statut') status?: string;
  @IsOptional() @Text({ label: 'Moyen de paiement', max: 30 }) paymentMethod?: string;
}

export class SaleStatusDto {
  @OneOf(SALE_STATUSES, 'Statut') status: string;
}
