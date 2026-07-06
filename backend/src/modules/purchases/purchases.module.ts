import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { Purchase } from './entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Supplier } from '../suppliers/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, Product, Supplier])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
