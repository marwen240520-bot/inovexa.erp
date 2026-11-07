import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from './entities/invoice.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Client, Supplier]), DocumentsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
