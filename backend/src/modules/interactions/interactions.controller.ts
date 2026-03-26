import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('interactions')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.service.findByCustomer(customerId);
  }

  @Get('customer/:customerId/timeline')
  getTimeline(@Param('customerId') customerId: string) {
    return this.service.getTimeline(customerId);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }
}
