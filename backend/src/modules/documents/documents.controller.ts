import {
  BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Request, Res, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Actor, DocumentsService } from './documents.service';
import { PaymentsService } from './payments.service';
<<<<<<< HEAD
=======
import { LegacyImportService } from './legacy-import.service';
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
import { DOC_META } from './documents.types';
import { PAYMENT_METHODS } from './entities/payment.entity';
import { DOCUMENT_TYPES } from './entities/document.entity';
import { VAT_RATES, WITHHOLDING_PRESETS } from '../../common/fiscal';
import {
  ApplyCreditDto, CancelDto, ConvertDto, CreateDocumentDto, InstallmentsDto, PaymentDto, RemindDto, SendDto, UpdateDocumentDto, VoidPaymentDto,
} from './documents.dto';

<<<<<<< HEAD
const actorOf = (req: any): Actor => ({
=======
export const actorOf = (req: any): Actor => ({
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
  userId: req.user.userId,
  actorId: req.user.actorId ?? req.user.userId,
  role: req.user.role,
  isTeamMember: !!req.user.isTeamMember,
  permissions: req.user.permissions,
  email: req.user.email,
});

const int = (v: any) => (v === undefined || v === '' ? undefined : Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : undefined);

/**
 * Cycle de vente et d'achat : devis, bons de livraison, factures, avoirs / bons de commande, réceptions, factures fournisseurs.
 * Un document validé est figé (numéro légal) : toute correction passe par un avoir.
 */
@ApiTags('Documents commerciaux')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DocumentsController {
<<<<<<< HEAD
  constructor(private readonly docs: DocumentsService, private readonly payments: PaymentsService) {}
=======
  constructor(private readonly docs: DocumentsService, private readonly payments: PaymentsService, private readonly legacyImport: LegacyImportService) {}
>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac

  // ── Routes statiques d'abord (avant « :id ») ──

  @Get('meta')
  @ApiOperation({ summary: 'Types de documents, moyens de paiement, taux de TVA et de retenue' })
  meta() {
    return {
      types: DOCUMENT_TYPES.map((t) => ({ type: t, ...DOC_META[t] })),
      paymentMethods: PAYMENT_METHODS,
      vatRates: VAT_RATES,
      withholdingPresets: WITHHOLDING_PRESETS,
    };
  }

  @Get('payments')
  @ApiOperation({ summary: 'Journal des règlements' })
  listPayments(@Request() req: any, @Query() q: any) {
    return this.payments.listPayments(req.user.userId, { documentId: int(q.documentId), partyType: q.partyType, from: q.from, to: q.to, method: q.method, limit: int(q.limit) });
  }

  @Post('payments/:paymentId/void')
  @ApiOperation({ summary: 'Annule un règlement (contre-passation comptable)' })
  voidPayment(@Request() req: any, @Param('paymentId', ParseIntPipe) paymentId: number, @Body() body: VoidPaymentDto) {
    return this.payments.voidPayment(actorOf(req), paymentId, body.reason);
  }

  @Get('reports/aging')
  @ApiOperation({ summary: 'Balance âgée des créances clients (side=client) ou des dettes fournisseurs (side=supplier)' })
  aging(@Request() req: any, @Query('side') side: string, @Query('asOf') asOf?: string) {
    if (side !== 'client' && side !== 'supplier') throw new BadRequestException('side doit valoir client ou supplier.');
    return this.payments.aging(req.user.userId, side, asOf);
  }

  @Get('reports/statement')
  @ApiOperation({ summary: 'Relevé de compte d’un client ou fournisseur' })
  statement(@Request() req: any, @Query('partyType') partyType: string, @Query('partyId') partyId: string) {
    if (partyType !== 'client' && partyType !== 'supplier') throw new BadRequestException('partyType doit valoir client ou supplier.');
    const id = int(partyId);
    if (!id) throw new BadRequestException('partyId requis.');
    return this.payments.statement(req.user.userId, partyType, id);
  }

  // ── Documents ──

  @Get()
  @ApiOperation({ summary: 'Liste filtrée des documents (type, statut, tiers, période, retard, recherche)' })
  list(@Request() req: any, @Query() q: any) {
    return this.docs.list(req.user.userId, {
      type: q.type, status: q.status, paymentStatus: q.paymentStatus, partyId: int(q.partyId), from: q.from, to: q.to,
      search: q.search, overdue: q.overdue === 'true' || q.overdue === '1', limit: int(q.limit), offset: int(q.offset),
    });
  }

<<<<<<< HEAD
=======
  @Post('import-legacy')
  @ApiOperation({ summary: 'Reprend les factures de l’ancien module (sans documentId) comme documents validés ; idempotent' })
  importLegacy(@Request() req: any) {
    return this.legacyImport.importAll(req.user.userId);
  }

>>>>>>> 808ae4f19ef0ab35f54afe3c9405e1dd88b29bac
  @Post()
  @ApiOperation({ summary: 'Crée un brouillon' })
  create(@Request() req: any, @Body() body: CreateDocumentDto) {
    return this.docs.create(actorOf(req), body);
  }

  @Get(':id')
  get(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.get(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifie un brouillon (un document validé est figé)' })
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: UpdateDocumentDto) {
    return this.docs.update(actorOf(req), id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprime un brouillon' })
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.remove(actorOf(req), id);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Valide : numéro légal, stock, comptabilité — le document est figé' })
  validate(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.validate(actorOf(req), id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convertit en un autre document (devis → BL / facture, BL → facture, facture → avoir…)' })
  convert(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ConvertDto) {
    return this.docs.convert(actorOf(req), id, body);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.duplicate(actorOf(req), id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annule un devis, bon de commande, de livraison ou de réception (une facture se corrige par un avoir)' })
  cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: CancelDto) {
    return this.docs.cancel(actorOf(req), id, body?.reason);
  }

  @Post(':id/accept')
  accept(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.decideQuote(actorOf(req), id, 'accepted');
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.decideQuote(actorOf(req), id, 'rejected');
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Envoie le document en PDF par email' })
  send(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: SendDto) {
    return this.docs.send(actorOf(req), id, body || {});
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Télécharge le PDF (mentions légales, TVA par taux, timbre, retenue, montant en lettres)' })
  async pdf(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Query('download') download: string, @Res() res: Response) {
    const { buffer, filename } = await this.docs.renderPdf(req.user.userId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(buffer.length),
      'Content-Disposition': `${download === '1' ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    });
    res.end(buffer);
  }

  @Get(':id/einvoice')
  @ApiOperation({ summary: 'Données structurées pour la facturation électronique (non certifié TTN)' })
  einvoice(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.docs.einvoice(req.user.userId, id);
  }

  // ── Règlements, échéancier, relances ──

  @Post(':id/payments')
  @ApiOperation({ summary: 'Enregistre un règlement (acompte, partiel ou solde)' })
  pay(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: PaymentDto) {
    return this.payments.addPayment(actorOf(req), id, body);
  }

  @Post(':id/installments')
  @ApiOperation({ summary: 'Définit l’échéancier de paiement' })
  installments(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: InstallmentsDto) {
    return this.docs.setInstallments(actorOf(req), id, body.installments);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Impute un avoir (id dans l’URL) sur une facture du même tiers' })
  apply(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: ApplyCreditDto) {
    return this.payments.applyCreditNote(actorOf(req), id, body);
  }

  @Post(':id/remind')
  @ApiOperation({ summary: 'Relance une facture impayée (email + historique CRM)' })
  remind(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: RemindDto) {
    return this.payments.remind(actorOf(req), id, body || {});
  }
}
