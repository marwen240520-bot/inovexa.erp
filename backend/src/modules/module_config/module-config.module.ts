import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleConfiguration } from './module-config.entity';
import { ModuleConfigService } from './module-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleConfiguration])],
  providers: [ModuleConfigService],
  exports: [ModuleConfigService],
})
export class ModuleConfigModule {}
