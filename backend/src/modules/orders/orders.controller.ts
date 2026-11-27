import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { ConvertOrderDto, CreateOrderDto, OrderStatusDto, UpdateOrderDto } from './orders.dto';
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
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: UpdateOrderDto) {
    return this.ordersService.update(id, req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: OrderStatusDto) {
    return this.ordersService.updateStatus(id, req.user.userId, body.status);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Crée le devis, le bon de livraison ou la facture (brouillon) correspondant à la commande' })
  convert(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: ConvertOrderDto) {
    return this.ordersService.convert(actorOf(req), id, body?.type || 'invoice');
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.ordersService.delete(id, req.user.userId);
  }
}
