import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.ordersService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.ordersService.create(req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.ordersService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.delete(parseInt(id), req.user.userId);
  }
}
