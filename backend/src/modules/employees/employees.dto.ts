import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { Amount, DateLike, Flag, OneOf, OptionalEmail, Text } from '../../common/dto';

export const EMPLOYEE_STATUSES = ['active', 'leave', 'inactive'] as const;

export class CreateEmployeeDto {
  @Text({ label: 'Nom', required: true, max: 120 }) name: string;
  @IsOptional() @OptionalEmail() email?: string;
  @IsOptional() @Text({ label: 'Poste', max: 120 }) position?: string;
  @IsOptional() @Text({ label: 'Département', max: 120 }) department?: string;
  @IsOptional() @Amount({ label: 'Salaire' }) salary?: number;
  @IsOptional() @Text({ label: 'Téléphone', max: 40 }) phone?: string;
  @IsOptional() @DateLike('Date d’embauche') hireDate?: string;
  @IsOptional() @OneOf(EMPLOYEE_STATUSES, 'Statut') status?: string;
  @IsOptional() @Text({ label: 'CIN', max: 20 }) cin?: string | null;
  @IsOptional() @Text({ label: 'N° CNSS', max: 30 }) cnssNumber?: string | null;
  @IsOptional() @Flag('Chef de famille') headOfFamily?: boolean;
  @IsOptional() @Amount({ label: 'Nombre d’enfants', int: true, max: 30 }) childrenCount?: number;
  @IsOptional() @Text({ label: 'Type de contrat', max: 12 }) contractType?: string | null;
  @IsOptional() @Amount({ label: 'Solde de congés initial', min: -365, max: 365 }) leaveBalanceStart?: number;
  /** Date d'entrée : elle sert au calcul des congés acquis. */
  @IsOptional() @DateLike('Date d’entrée') createdAt?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class EmployeeStatusDto {
  @OneOf(EMPLOYEE_STATUSES, 'Statut') status: string;
}
