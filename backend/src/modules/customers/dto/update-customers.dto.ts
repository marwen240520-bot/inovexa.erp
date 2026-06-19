import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomersModuleDto } from './create-customers.dto';

export class UpdateCustomersModuleDto extends PartialType(CreateCustomersModuleDto) {}
