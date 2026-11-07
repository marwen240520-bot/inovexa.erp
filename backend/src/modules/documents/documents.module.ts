import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PaymentsService } from './payments.service';
import { DocumentPdfService } from './document-pdf.service';
import { LegacyMirrorService } from './legacy-mirror.service';
import { Document } from './entities/document.entity';
import { DocumentLine } from './entities/document-line.entity';
import { Payment } from './entities/payment.entity';
import { DocumentInstallment } from './entities/document-installment.entity';
import { StockModule } from '../stock/stock.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentLine, Payment, DocumentInstallment]), StockModule, AccountingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PaymentsService, DocumentPdfService, LegacyMirrorService],
  exports: [DocumentsService, PaymentsService, DocumentPdfService],
})
export class DocumentsModule {}
