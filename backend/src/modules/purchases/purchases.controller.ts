import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll(@Request() req: any, @Query('period') period?: string) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.findAll(userId, period);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.getStats(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.create(userId, body);
  }

  // ⭐ NOUVEAU: Endpoint pour l'import multiple
  @Post('import')
  async importPurchases(@Request() req: any, @Body() body: { purchases: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.purchases?.length, 'achats pour user', userId);
    return this.purchasesService.importPurchases(userId, body.purchases || []);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.update(parseInt(id), userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.updateStatus(parseInt(id), userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.purchasesService.delete(parseInt(id), userId);
  }
}