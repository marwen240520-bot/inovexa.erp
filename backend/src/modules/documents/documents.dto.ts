import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { DOCUMENT_TYPES } from './entities/document.entity';
import { PAYMENT_METHODS } from './entities/payment.entity';

export class DocLineDto {
  @IsOptional() @IsInt() productId?: number;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(1_000_000_000) quantity: number;
  /** Prix unitaire HT ; absent = prix du catalogue (ou de la liste de prix du client). */
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @Max(1_000_000_000) unitPriceHT?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) discountPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) vatRate?: number;
  @IsOptional() @IsString() @MaxLength(20) unit?: string;
  @IsOptional() @IsString() @MaxLength(60) lotNumber?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsInt() warehouseId?: number;
  @IsOptional() @IsBoolean() returnToStock?: boolean;
  @IsOptional() @IsInt() sourceLineId?: number;
}

export class InstallmentDto {
  @IsDateString() dueDate: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) amount: number;
  @IsOptional() @IsString() @MaxLength(120) label?: string;
}

export class CreateDocumentDto {
  @IsIn(DOCUMENT_TYPES) type: string;
  @IsOptional() @IsInt() partyId?: number;
  @IsOptional() @IsString() @MaxLength(200) partyName?: string;
  @IsOptional() @IsString() @MaxLength(40) partyTaxId?: string;
  @IsOptional() @IsString() @MaxLength(300) partyAddress?: string;
  @IsOptional() @IsString() @MaxLength(160) partyEmail?: string;
  @IsOptional() @IsString() @MaxLength(40) partyPhone?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(80) externalRef?: string;
  @IsOptional() @IsInt() warehouseId?: number;
  @IsOptional() @IsString() @MaxLength(120) paymentTerms?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(2000) footer?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) globalDiscountPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) withholdingRate?: number;
  /** Droit de timbre : true/false pour forcer, absent = règle de la société. */
  @IsOptional() @IsBoolean() applyStamp?: boolean;
  @IsOptional() @IsBoolean() affectsStock?: boolean;
  @IsOptional() @IsInt() creditedDocumentId?: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => DocLineDto) lines: DocLineDto[];
  @IsOptional() @IsArray() @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => InstallmentDto) installments?: InstallmentDto[];
}

export class UpdateDocumentDto {
  @IsOptional() @IsInt() partyId?: number;
  @IsOptional() @IsString() @MaxLength(200) partyName?: string;
  @IsOptional() @IsString() @MaxLength(40) partyTaxId?: string;
  @IsOptional() @IsString() @MaxLength(300) partyAddress?: string;
  @IsOptional() @IsString() @MaxLength(160) partyEmail?: string;
  @IsOptional() @IsString() @MaxLength(40) partyPhone?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() validUntil?: string;
  @IsOptional() @IsString() @MaxLength(80) externalRef?: string;
  @IsOptional() @IsInt() warehouseId?: number;
  @IsOptional() @IsString() @MaxLength(120) paymentTerms?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsString() @MaxLength(2000) footer?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) globalDiscountPct?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) withholdingRate?: number;
  @IsOptional() @IsBoolean() applyStamp?: boolean;
  @IsOptional() @IsBoolean() affectsStock?: boolean;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => DocLineDto) lines?: DocLineDto[];
}

export class ConvertDto {
  @IsIn(DOCUMENT_TYPES) to: string;
  /** Pour regrouper plusieurs bons de livraison / réception dans une seule facture. */
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsInt({ each: true }) alsoIds?: number[];
  /** Avoir partiel : lignes (id de la ligne d'origine) et quantités à créditer. Absent = avoir total. */
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreditLineDto) creditLines?: CreditLineDto[];
}

export class CreditLineDto {
  @IsInt() lineId: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) quantity: number;
  @IsOptional() @IsBoolean() returnToStock?: boolean;
}

export class CancelDto {
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

export class PaymentDto {
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) amount: number;
  @IsIn(PAYMENT_METHODS as unknown as string[]) method: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
  @IsOptional() @IsInt() bankAccountId?: number;
  @IsOptional() @IsString() @MaxLength(300) notes?: string;
}

export class VoidPaymentDto {
  @IsString() @MaxLength(300) reason: string;
}

export class ApplyCreditDto {
  @IsInt() invoiceId: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) amount?: number;
}

export class InstallmentsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(60) @ValidateNested({ each: true }) @Type(() => InstallmentDto) installments: InstallmentDto[];
}

export class SendDto {
  @IsOptional() @IsString() @MaxLength(300) to?: string;
  @IsOptional() @IsString() @MaxLength(200) subject?: string;
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
}

export class RemindDto {
  @IsOptional() @IsIn([1, 2, 3]) @IsInt() level?: number;
  @IsOptional() @IsString() @MaxLength(4000) message?: string;
  @IsOptional() @IsBoolean() sendEmail?: boolean;
}

export class QuoteDecisionDto {
  @IsIn(['accepted', 'rejected']) status: 'accepted' | 'rejected';
}
