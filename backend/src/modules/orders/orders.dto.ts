import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Amount, OneOf, Text } from '../../common/dto';

export const ORDER_STATUSES = ['pending', 'processing', 'delivered', 'cancelled'] as const;

export class CreateOrderDto {
  @IsOptional() @Amount({ label: 'Client', int: true, min: 1, max: 2_147_483_647 }) clientId?: number | null;
  @IsOptional() @Amount({ label: 'Produit', int: true, min: 1, max: 2_147_483_647 }) productId?: number | null;
  @Text({ label: 'Client', required: true, max: 160 }) clientName: string;
  @Text({ label: 'Produit', required: true, max: 160 }) productName: string;
  /** La colonne est un entier : une commande porte sur des unités entières. */
  @IsOptional() @Amount({ label: 'Quantité', int: true, min: 1, max: 1_000_000_000 }) quantity?: number;
  @IsOptional() @Amount({ label: 'Prix unitaire' }) unitPrice?: number;
  @IsOptional() @OneOf(ORDER_STATUSES, 'Statut') status?: string;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}

export class OrderStatusDto {
  @OneOf(ORDER_STATUSES, 'Statut') status: string;
}

export class ConvertOrderDto {
  @IsOptional() @OneOf(['quote', 'delivery_note', 'invoice'], 'Type de document') type?: 'quote' | 'delivery_note' | 'invoice';
}
