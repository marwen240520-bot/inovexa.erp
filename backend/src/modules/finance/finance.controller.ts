import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('invoices')
  findAllInvoices() {
    return this.financeService.findAllInvoices();
  }

  @Get('invoices/:id')
  findInvoiceById(@Param('id') id: string) {
    return this.financeService.findInvoiceById(id);
  }

  @Post('invoices')
  createInvoice(@Body() data: Partial<Invoice>) {
    return this.financeService.createInvoice(data);
  }

  @Put('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() data: Partial<Invoice>) {
    return this.financeService.updateInvoice(id, data);
  }

  @Delete('invoices/:id')
  deleteInvoice(@Param('id') id: string) {
    return this.financeService.deleteInvoice(id);
  }

  @Post('payments')
  createPayment(@Body() data: Partial<Payment>) {
    return this.financeService.createPayment(data);
  }

  @Get('dashboard')
  getDashboard() {
    return this.financeService.getDashboardStats();
  }
}
