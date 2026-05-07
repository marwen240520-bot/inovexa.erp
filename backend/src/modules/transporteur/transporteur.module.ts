import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporteurController } from './transporteur.controller';
import { TransporteurService } from './transporteur.service';
import { Shipment } from '../logistics/entities/shipment.entity';
import { Transporteur } from '../transporteurs/entities/transporteur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Transporteur])],
  controllers: [TransporteurController],
  providers: [TransporteurService],
  exports: [TransporteurService],
})
export class TransporteurModule {}