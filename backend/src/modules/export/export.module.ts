import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportModuleController } from './export.controller';
import { ExportModuleService } from './export.service';
import { ExportModuleEntity } from './entities/export.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExportModuleEntity])],
  controllers: [ExportModuleController],
  providers: [ExportModuleService],
  exports: [ExportModuleService],
})
export class ExportModule {}
