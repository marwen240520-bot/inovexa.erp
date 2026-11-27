import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto, SaleStatusDto } from './sales.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Ventes (historique)')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Request() req: any, @Query('period') period?: string) {
    return this.salesService.findAll(req.user.userId, period);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.salesService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.salesService.findOne(id, req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateSaleDto) {
    return this.salesService.create(req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: SaleStatusDto) {
    return this.salesService.updateStatus(id, req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.salesService.delete(id, req.user.userId);
  }

  @Post('import')
  async importSales(@Request() req: any, @Body() body: { sales: any[] }) {
    return this.salesService.importSales(req.user.userId, body.sales);
  }
}
