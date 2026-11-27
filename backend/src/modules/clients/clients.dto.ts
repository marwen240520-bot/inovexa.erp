import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Amount, OneOf, OptionalEmail, Text } from '../../common/dto';

export const CLIENT_STATUSES = ['active', 'inactive'] as const;

export class CreateClientDto {
  @Text({ label: 'Nom', required: true, max: 160 }) name: string;
  @IsOptional() @OptionalEmail() email?: string;
  @IsOptional() @Text({ label: 'Téléphone', max: 40 }) phone?: string;
  @IsOptional() @Text({ label: 'Adresse', max: 300 }) address?: string;
  @IsOptional() @Amount({ label: 'Total dépensé' }) totalSpent?: number;
  @IsOptional() @OneOf(CLIENT_STATUSES, 'Statut') status?: string;
  @IsOptional() @Text({ label: 'Matricule fiscal', max: 40 }) taxId?: string | null;
  @IsOptional() @Amount({ label: 'Délai de paiement (jours)', int: true, max: 365 }) paymentTermsDays?: number | null;
  @IsOptional() @Amount({ label: 'Plafond d’encours', max: 99_999_999_999.999 }) creditLimit?: number | null;
  @IsOptional() @Amount({ label: 'Remise (%)', max: 100 }) discountPct?: number;
  @IsOptional() @Amount({ label: 'Retenue à la source (%)', max: 100 }) withholdingRate?: number;
  @IsOptional() @Amount({ label: 'Liste de prix', int: true, min: 1, max: 2_147_483_647 }) priceListId?: number | null;
  @IsOptional() @Text({ label: 'Notes', max: 5_000 }) notes?: string | null;
}

/** Modification : tous les champs sont facultatifs, mais un champ présent doit rester valide (un nom ne peut pas devenir vide). */
export class UpdateClientDto extends PartialType(CreateClientDto) {}

export class ClientStatusDto {
  @OneOf(CLIENT_STATUSES, 'Statut') status: string;
}
