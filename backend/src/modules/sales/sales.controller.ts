import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';

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
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.salesService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.salesService.create(req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.salesService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.salesService.delete(parseInt(id), req.user.userId);
  }

  @Post('import')
  async importSales(@Request() req: any, @Body() body: { sales: any[] }) {
    return this.salesService.importSales(req.user.userId, body.sales);
  }
}
