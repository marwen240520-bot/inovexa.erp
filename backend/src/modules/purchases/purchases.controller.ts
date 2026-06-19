import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll(@Request() req: any, @Query('period') period?: string) {
    return this.purchasesService.findAll(req.user.userId, period);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.purchasesService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.purchasesService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.purchasesService.create(req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.purchasesService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Post('import')
  async importPurchases(@Request() req: any, @Body() body: { purchases: any[] }) {
    return this.purchasesService.importPurchases(req.user.userId, body.purchases);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.purchasesService.delete(parseInt(id), req.user.userId);
  }
}
