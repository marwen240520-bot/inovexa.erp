import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminModuleDto } from './create-admin.dto';

export class UpdateAdminModuleDto extends PartialType(CreateAdminModuleDto) {}
