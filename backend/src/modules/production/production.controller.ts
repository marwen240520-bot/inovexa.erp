import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductionService } from './production.service';

@Controller('production/orders')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.productionService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.productionService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.productionService.create(req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.productionService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Patch(':id/progress')
  async updateProgress(@Param('id') id: string, @Request() req: any, @Body() body: { progress: number }) {
    return this.productionService.updateProgress(parseInt(id), req.user.userId, body.progress);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.productionService.delete(parseInt(id), req.user.userId);
  }
}
