import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Warehouse } from './entities/warehouse.entity';
import { StockLevel } from './entities/stock-level.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockLot } from './entities/stock-lot.entity';
import { StockCount } from './entities/stock-count.entity';
import { StockCountLine } from './entities/stock-count-line.entity';
import { StockService } from './stock.service';
import { StockReportsService } from './stock-reports.service';
import { StockCountsService } from './stock-counts.service';
import { StockController } from './stock.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Warehouse, StockLevel, StockMovement, StockLot, StockCount, StockCountLine])],
  controllers: [StockController],
  providers: [StockService, StockReportsService, StockCountsService],
  exports: [StockService, StockReportsService],
})
export class StockModule {}
