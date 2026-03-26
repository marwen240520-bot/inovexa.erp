import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StockMovementsService } from './stock_movements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard)
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() data: any) { return this.service.create(data); }
}
