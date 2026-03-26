import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('warehouses')
@UseGuards(JwtAuthGuard)
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() data: any) { return this.service.create(data); }
}
