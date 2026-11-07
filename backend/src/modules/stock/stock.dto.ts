import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class WarehouseDto {
  @IsString() @MaxLength(120) name: string;
  @IsOptional() @IsString() @Matches(/^[A-Za-z0-9_-]{1,20}$/, { message: 'Code : 1 à 20 lettres, chiffres, - ou _' }) code?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AdjustmentDto {
  @IsInt() productId: number;
  @IsOptional() @IsInt() warehouseId?: number;
  /** Variation signée (+ entrée, − sortie)… */
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) quantity?: number;
  /** …ou quantité cible : l'écart est calculé pour atteindre ce stock. */
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) newQuantity?: number;
  @IsIn(['manual', 'loss', 'damage', 'found', 'return', 'inventory', 'production', 'opening']) reason: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) unitCost?: number;
  @IsOptional() @IsString() @MaxLength(60) lotNumber?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class TransferLineDto {
  @IsInt() productId: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) quantity: number;
  @IsOptional() @IsString() @MaxLength(60) lotNumber?: string;
}

export class TransferDto {
  @IsInt() fromWarehouseId: number;
  @IsInt() toWarehouseId: number;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => TransferLineDto) lines: TransferLineDto[];
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class CostDto {
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) avgCost: number;
}

export class ProductStockSettingsDto {
  @IsOptional() @IsInt() @Min(0) minStock?: number;
  @IsOptional() @IsString() @MaxLength(20) unit?: string;
  @IsOptional() @IsNumber() @Min(0) vatRate?: number;
  @IsOptional() @IsString() @MaxLength(64) barcode?: string;
  @IsOptional() @IsBoolean() isStockable?: boolean;
  @IsOptional() @IsBoolean() trackLots?: boolean;
}

export class CountCreateDto {
  @IsInt() warehouseId: number;
  @IsOptional() @IsArray() @ArrayMaxSize(5000) @IsInt({ each: true }) productIds?: number[];
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class CountLineDto {
  @IsInt() productId: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) countedQty: number;
}

export class CountLinesDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(5000) @ValidateNested({ each: true }) @Type(() => CountLineDto) lines: CountLineDto[];
}
