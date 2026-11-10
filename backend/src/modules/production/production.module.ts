import { Module } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductionOrder } from './entities/production-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductionOrder]), StockModule],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
