import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { IaChat } from './entities/ia-chat.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IaChat,
      Sale,
      Purchase,
      Product,
      Client,
      Order,
      Invoice
    ])
  ],
  controllers: [IaController],
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
