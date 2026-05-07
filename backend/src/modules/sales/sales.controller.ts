import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Request() req: any, @Query('period') period?: string) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('🔍 userId dans controller:', userId);
    return this.salesService.findAll(userId, period);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.salesService.getStats(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.salesService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const saleData = { ...body, userId };
    return this.salesService.create(userId, saleData);
  }

  // ⭐ NOUVEAU: Endpoint pour l'import multiple
  @Post('import')
  async importSales(@Request() req: any, @Body() body: { sales: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.sales?.length, 'ventes pour user', userId);
    return this.salesService.importSales(userId, body.sales || []);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.salesService.update(parseInt(id), userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.salesService.updateStatus(parseInt(id), userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.salesService.delete(parseInt(id), userId);
  }
}