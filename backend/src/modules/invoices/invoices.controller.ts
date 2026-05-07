import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.findAll(userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.getStats(userId);
  }

  // ⭐ RECHERCHE PAR ID (interne - à ne pas exposer dans l'API publique)
  @Get('id/:id')
  async findById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.findOne(parseInt(id), userId);
  }

  // ⭐ RECHERCHE PAR NUMÉRO D'OPÉRATION (API publique)
  @Get('number/:operationNumber')
  async findByOperationNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.findByOperationNumber(operationNumber, userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.create(userId, body);
  }

  @Post('import')
  async importInvoices(@Request() req: any, @Body() body: { invoices: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.invoices?.length, 'factures pour user', userId);
    return this.invoicesService.importInvoices(userId, body.invoices || []);
  }

  // ⭐ MISE À JOUR PAR ID (interne)
  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.update(parseInt(id), userId, body);
  }

  // ⭐ MARQUER COMME PAYÉE PAR NUMÉRO D'OPÉRATION
  @Patch('number/:operationNumber/pay')
  async markAsPaidByNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.markAsPaidByOperationNumber(operationNumber, userId);
  }

  // ⭐ MARQUER COMME PAYÉE PAR ID (interne)
  @Patch(':id/pay')
  async markAsPaid(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.markAsPaid(parseInt(id), userId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.updateStatus(parseInt(id), userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.delete(parseInt(id), userId);
  }

  // ⭐ SUPPRESSION PAR NUMÉRO D'OPÉRATION
  @Delete('number/:operationNumber')
  async deleteByNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.invoicesService.deleteByOperationNumber(operationNumber, userId);
  }
}