import { IsOptional } from 'class-validator';
import { Text } from '../../common/dto';

export class CreateDepartmentDto {
  @Text({ label: 'Nom du département', required: true, max: 120 }) name: string;
  @IsOptional() @Text({ label: 'Description', max: 500 }) description?: string;
}
