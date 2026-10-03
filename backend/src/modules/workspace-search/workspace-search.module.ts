import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { Product } from '../products/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Order } from '../orders/entities/order.entity';
import { Employee } from '../employees/entities/employee.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { WorkspaceSearchController } from './workspace-search.controller';
import { WorkspaceSearchService } from './workspace-search.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, Supplier, Product, Category, Invoice, Sale, Purchase, Order, Employee, Shipment])],
  controllers: [WorkspaceSearchController],
  providers: [WorkspaceSearchService],
})
export class WorkspaceSearchModule {}
