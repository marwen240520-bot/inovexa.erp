import { PartialType } from '@nestjs/mapped-types';
import { CreateSearchModuleDto } from './create-search.dto';

export class UpdateSearchModuleDto extends PartialType(CreateSearchModuleDto) {}
