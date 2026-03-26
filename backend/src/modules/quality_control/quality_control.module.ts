import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QualityControl } from './quality_control.entity';
import { QualityControlService } from './quality_control.service';
import { QualityControlController } from './quality_control.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QualityControl])],
  controllers: [QualityControlController],
  providers: [QualityControlService],
  exports: [QualityControlService],
})
export class QualityControlModule {}
