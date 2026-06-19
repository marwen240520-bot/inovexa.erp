import { Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.invoicesService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.findOne(parseInt(id), req.user.userId);
  }

  @Get('number/:operationNumber')
  async findByOperationNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    return this.invoicesService.findByOperationNumber(operationNumber, req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.invoicesService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.invoicesService.update(parseInt(id), req.user.userId, body);
  }

  @Patch(':id/pay')
  async markAsPaid(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.markAsPaid(parseInt(id), req.user.userId);
  }

  @Patch('number/:operationNumber/pay')
  async markAsPaidByOperationNumber(@Param('operationNumber') operationNumber: string, @Request() req: any) {
    return this.invoicesService.markAsPaidByOperationNumber(operationNumber, req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.delete(parseInt(id), req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.invoicesService.getStats(req.user.userId);
  }
}