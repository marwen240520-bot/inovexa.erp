import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchModuleController } from './search.controller';
import { SearchModuleService } from './search.service';
import { SearchModuleEntity } from './entities/search.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SearchModuleEntity])],
  controllers: [SearchModuleController],
  providers: [SearchModuleService],
  exports: [SearchModuleService],
})
export class SearchModule {}
