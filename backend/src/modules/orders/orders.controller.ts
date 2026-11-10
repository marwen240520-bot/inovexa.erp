import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { actorOf } from '../documents/documents.controller';

import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
@ApiTags('Commandes')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Request() req: any, @Query('period') period?: string) {
    return this.ordersService.findAll(req.user.userId, period);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.ordersService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.ordersService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.ordersService.update(parseInt(id), req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Crée le devis, le bon de livraison ou la facture (brouillon) correspondant à la commande' })
  convert(@Param('id') id: string, @Request() req: any, @Body() body: { type?: 'quote' | 'delivery_note' | 'invoice' }) {
    return this.ordersService.convert(actorOf(req), parseInt(id, 10), body?.type || 'invoice');
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.delete(parseInt(id), req.user.userId);
  }
}
