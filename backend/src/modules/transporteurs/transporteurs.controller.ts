import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransporteursService } from './transporteurs.service';

@Controller('transporteurs')
@UseGuards(JwtAuthGuard)
export class TransporteursController {
  constructor(private readonly transporteursService: TransporteursService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.transporteursService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.transporteursService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.transporteursService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.transporteursService.update(parseInt(id), req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.transporteursService.delete(parseInt(id), req.user.userId);
  }
}
