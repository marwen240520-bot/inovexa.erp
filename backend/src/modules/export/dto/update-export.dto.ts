import { PartialType } from '@nestjs/mapped-types';
import { CreateExportModuleDto } from './create-export.dto';

export class UpdateExportModuleDto extends PartialType(CreateExportModuleDto) {}
