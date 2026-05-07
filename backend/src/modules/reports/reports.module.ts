import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Shipment } from '../logistics/entities/shipment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, Purchase, Product, Client, Order, Invoice, Employee, Shipment])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
