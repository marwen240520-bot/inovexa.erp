import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PaymentsService } from './payments.service';
import { DocumentPdfService } from './document-pdf.service';
import { LegacyMirrorService } from './legacy-mirror.service';
<<<<<<< HEAD
=======
import { LegacyImportService } from './legacy-import.service';
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { Payment } from './entities/payment.entity';
import { DocumentInstallment } from './entities/document-installment.entity';
<<<<<<< HEAD
=======
import { Invoice } from '../invoices/entities/invoice.entity';
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
<<<<<<< HEAD
  imports: [TypeOrmModule.forFeature([Document, DocumentLine, Payment, DocumentInstallment]), StockModule, AccountingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PaymentsService, DocumentPdfService, LegacyMirrorService],
  exports: [DocumentsService, PaymentsService, DocumentPdfService],
=======
  imports: [TypeOrmModule.forFeature([Document, DocumentLine, Payment, DocumentInstallment, Invoice]), StockModule, AccountingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PaymentsService, DocumentPdfService, LegacyMirrorService, LegacyImportService],
  exports: [DocumentsService, PaymentsService, DocumentPdfService, LegacyImportService],
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
})
export class DocumentsModule {}
