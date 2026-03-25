import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Customer } from './entities/customer.entity';
import { Quote } from './entities/quote.entity';

@Controller('sales')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get('customers')
  findAllCustomers() {
    return this.salesService.findAllCustomers();
  }

  @Get('customers/:id')
  findCustomerById(@Param('id') id: string) {
    return this.salesService.findCustomerById(id);
  }

  @Post('customers')
  createCustomer(@Body() data: Partial<Customer>) {
    return this.salesService.createCustomer(data);
  }

  @Put('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() data: Partial<Customer>) {
    return this.salesService.updateCustomer(id, data);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.salesService.deleteCustomer(id);
  }

  @Post('quotes')
  createQuote(@Body() data: Partial<Quote>) {
    return this.salesService.createQuote(data);
  }

  @Get('dashboard')
  getDashboard() {
    return this.salesService.getSalesStats();
  }
}
