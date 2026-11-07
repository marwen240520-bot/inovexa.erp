import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PaymentsService } from './payments.service';
import { DocumentPdfService } from './document-pdf.service';
import { LegacyMirrorService } from './legacy-mirror.service';
import { LegacyImportService } from './legacy-import.service';
import { TeifService } from './teif.service';
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { Payment } from './entities/payment.entity';
import { DocumentInstallment } from './entities/document-installment.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentLine, Payment, DocumentInstallment, Invoice]), StockModule, AccountingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PaymentsService, DocumentPdfService, LegacyMirrorService, LegacyImportService, TeifService],
  exports: [DocumentsService, PaymentsService, DocumentPdfService, LegacyImportService, TeifService],
})
export class DocumentsModule {}
