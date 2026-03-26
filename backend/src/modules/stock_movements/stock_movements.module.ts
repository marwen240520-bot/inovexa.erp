import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock_movement.entity';
import { StockMovementsService } from './stock_movements.service';
import { StockMovementsController } from './stock_movements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
