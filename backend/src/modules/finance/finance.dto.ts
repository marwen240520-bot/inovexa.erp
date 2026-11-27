import { IsOptional } from 'class-validator';
import { Amount, DateLike, OneOf, Text } from '../../common/dto';

export const BANK_ACCOUNT_TYPES = ['checking', 'savings', 'cash'] as const;

/** ?year=2026&month=0 (mois de 0 à 11, comme le site). Année absente : année en cours. */
export class YearMonthQuery {
  @IsOptional() @Amount({ label: 'Année', int: true, min: 2000, max: 2100 }) year?: number;
  @IsOptional() @Amount({ label: 'Mois', int: true, min: 0, max: 11 }) month?: number;
}

export class ExpenseDto {
  /** Montant TTC payé. */
  @Amount({ label: 'Montant', min: 0.001 }) amount: number;
  @IsOptional() @Amount({ label: 'Montant HT' }) amountHT?: number;
  @IsOptional() @Amount({ label: 'TVA' }) taxAmount?: number;
  @IsOptional() @Amount({ label: 'Taux de TVA (%)', max: 100 }) taxRate?: number;
  @Text({ label: 'Catégorie', required: true, max: 80 }) category: string;
  @IsOptional() @Text({ label: 'Description', max: 500 }) description?: string;
  @IsOptional() @DateLike('Date') date?: string;
  @IsOptional() @Text({ label: 'Moyen de paiement', max: 30 }) paymentMethod?: string;
  @IsOptional() @Text({ label: 'Fournisseur', max: 160 }) vendor?: string;
  @IsOptional() @Text({ label: 'N° de facture', max: 60 }) invoiceNumber?: string;
}

export class BudgetDto {
  @Text({ label: 'Catégorie', required: true, max: 80 }) category: string;
  @Amount({ label: 'Montant' }) amount: number;
  @Amount({ label: 'Année', int: true, min: 2000, max: 2100 }) year: number;
  @IsOptional() @Text({ label: 'Département', max: 120 }) department?: string;
}

export class BankAccountDto {
  @Text({ label: 'Nom du compte', required: true, max: 120 }) name: string;
  @IsOptional() @OneOf(BANK_ACCOUNT_TYPES, 'Type de compte') type?: string;
  @IsOptional() @Amount({ label: 'Solde', min: -99_999_999.99 }) balance?: number;
  @IsOptional() @Text({ label: 'N° de compte', max: 40 }) accountNumber?: string;
  @IsOptional() @Text({ label: 'IBAN', max: 40 }) iban?: string;
}
