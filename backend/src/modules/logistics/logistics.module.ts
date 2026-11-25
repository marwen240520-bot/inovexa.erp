import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { Shipment } from './entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Transporteur])],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
