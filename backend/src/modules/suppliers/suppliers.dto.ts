import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Amount, OneOf, OptionalEmail, Text } from '../../common/dto';

export const SUPPLIER_STATUSES = ['active', 'inactive'] as const;

export class CreateSupplierDto {
  @Text({ label: 'Nom', required: true, max: 160 }) name: string;
  @IsOptional() @Text({ label: 'Contact', max: 120 }) contact?: string;
  @IsOptional() @OptionalEmail() email?: string;
  @IsOptional() @Text({ label: 'Téléphone', max: 40 }) phone?: string;
  @IsOptional() @Text({ label: 'Adresse', max: 300 }) address?: string;
  @IsOptional() @Amount({ label: 'Total des achats' }) totalPurchases?: number;
  @IsOptional() @OneOf(SUPPLIER_STATUSES, 'Statut') status?: string;
  @IsOptional() @Text({ label: 'Matricule fiscal', max: 40 }) taxId?: string | null;
  @IsOptional() @Amount({ label: 'Délai de paiement (jours)', int: true, max: 365 }) paymentTermsDays?: number | null;
  @IsOptional() @Text({ label: 'RIB / IBAN', max: 60 }) bankAccount?: string | null;
  @IsOptional() @Amount({ label: 'Retenue à la source (%)', max: 100 }) withholdingRate?: number;
  @IsOptional() @Text({ label: 'Notes', max: 5_000 }) notes?: string | null;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class SupplierStatusDto {
  @OneOf(SUPPLIER_STATUSES, 'Statut') status: string;
}
