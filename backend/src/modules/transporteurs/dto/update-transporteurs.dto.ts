import { PartialType } from '@nestjs/mapped-types';
import { CreateTransporteursModuleDto } from './create-transporteurs.dto';

export class UpdateTransporteursModuleDto extends PartialType(CreateTransporteursModuleDto) {}
