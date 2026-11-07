import { BadRequestException, Body, Controller, Delete, Get, GoneException, Param, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from '../documents/payments.service';
import { LegacyImportService } from '../documents/legacy-import.service';
import { Document } from '../documents/entities/document.entity';
import { actorOf } from '../documents/documents.controller';
import { PAYMENT_METHODS } from '../documents/entities/payment.entity';
import { InvoicesService } from './invoices.service';

<<<<<<< HEAD
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Factures (historique)')
=======
/**
 * Ancien module « Factures ». Depuis la fusion avec les documents commerciaux, la table `invoices` n'est plus
 * qu'un REFLET en lecture seule des factures validées (tableau de bord, analyses, assistant). Les factures
 * saisies ici avant la fusion sont reprises automatiquement dans Documents (voir LegacyImportService).
 */
@ApiTags('Factures (ancien module — lecture seule)')
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly payments: PaymentsService,
    private readonly legacyImport: LegacyImportService,
    @InjectDataSource() private readonly ds: DataSource,
  ) {}

  private gone(): never {
    throw new GoneException('Les factures se créent et se modifient désormais dans Documents (POST /documents, puis /documents/:id/validate).');
  }

  @Get()
  @ApiOperation({ summary: 'Reflet des factures validées (lecture seule)' })
  async findAll(@Request() req: any) {
    await this.legacyImport.ensure(req.user.userId);
    return this.invoicesService.findAll(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.invoicesService.getStats(req.user.userId);
  }

  @Get('number/:operationNumber')
  async findByOperationNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    return this.invoicesService.findByOperationNumber(operationNumber, req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.findOne(parseInt(id, 10), req.user.userId);
  }

  /** Import Excel d'un historique : les lignes importées sont aussitôt reprises comme documents validés. */
  @Post('import')
  @ApiOperation({ summary: 'Importe un historique de factures (Excel) puis le reprend dans Documents' })
  async importInvoices(@Request() req: any, @Body() body: { invoices: any[] }) {
    const result = await this.invoicesService.importInvoices(req.user.userId, body?.invoices);
    const migrated = await this.legacyImport.importAll(req.user.userId);
    return { ...result, migrated };
  }

  @Post() create() { this.gone(); }
  @Put(':id') update() { this.gone(); }
  @Delete(':id') delete() { this.gone(); }

  /** Compatibilité : « marquer payée » enregistre un règlement du solde sur le document correspondant. */
  @Patch(':id/pay')
  async markAsPaid(@Param('id') id: string, @Request() req: any, @Body() body?: { paymentMethod?: string }) {
    const invoice = await this.invoicesService.findOne(parseInt(id, 10), req.user.userId);
    return this.settle(req, invoice, body?.paymentMethod);
  }

  @Patch('number/:operationNumber/pay')
  async markAsPaidByOperationNumber(@Param('operationNumber') operationNumber: string, @Request() req: any, @Body() body?: { paymentMethod?: string }) {
    const invoice = await this.invoicesService.findByOperationNumber(operationNumber, req.user.userId);
    return this.settle(req, invoice, body?.paymentMethod);
  }

  private async settle(req: any, invoice: { id: number; documentId: number | null }, paymentMethod?: string) {
    if (!invoice.documentId) {
      await this.legacyImport.importAll(req.user.userId);
      invoice = await this.invoicesService.findOne(invoice.id, req.user.userId);
      if (!invoice.documentId) throw new BadRequestException('Facture sans document associé : relancez POST /documents/import-legacy.');
    }
    const doc = await this.ds.getRepository(Document).findOne({ where: { id: invoice.documentId, userId: req.user.userId } });
    if (!doc) throw new BadRequestException('Document introuvable.');
    if (Number(doc.balanceDue) <= 0) return { already: true, documentId: doc.id };
    const method = (PAYMENT_METHODS as readonly string[]).includes(paymentMethod || '') && paymentMethod !== 'credit_note' ? paymentMethod! : 'other';
    return this.payments.addPayment(actorOf(req), doc.id, { amount: Number(doc.balanceDue), method });
  }
}
