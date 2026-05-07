import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModulesController } from './client-modules.controller';
import { ClientModulesService } from './client-modules.service';
import { ClientModules } from './entities/client-modules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientModules])],
  controllers: [ClientModulesController],
  providers: [ClientModulesService],
  exports: [ClientModulesService],
})
export class ClientModulesModule {}
