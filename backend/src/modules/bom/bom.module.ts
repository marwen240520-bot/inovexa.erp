import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bom } from './bom.entity';
import { BomService } from './bom.service';
import { BomController } from './bom.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bom])],
  controllers: [BomController],
  providers: [BomService],
  exports: [BomService],
})
export class BomModule {}
