import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';

import { StockModule } from '../stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Product, Client]), StockModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
