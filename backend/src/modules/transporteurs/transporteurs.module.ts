import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransporteursController } from './transporteurs.controller';
import { TransporteursService } from './transporteurs.service';
import { Transporteur } from './entities/transporteur.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transporteur, User])],
  controllers: [TransporteursController],
  providers: [TransporteursService],
  exports: [TransporteursService],
})
export class TransporteursModule {}
