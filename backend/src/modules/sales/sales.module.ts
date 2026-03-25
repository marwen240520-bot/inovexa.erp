import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Customer } from './entities/customer.entity';
import { Quote } from './entities/quote.entity';
import { SalesOrder } from './entities/sales-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Quote, SalesOrder])],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
