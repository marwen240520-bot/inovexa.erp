import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransporteursService } from './transporteurs.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Transporteurs')
@ApiBearerAuth()
@Controller('transporteurs')
@UseGuards(JwtAuthGuard)
export class TransporteursController {
  constructor(private readonly transporteursService: TransporteursService) {}

  /** La gestion des transporteurs appartient à la société ; un transporteur connecté n'y a pas accès. */
  private assertCompany(req: any) {
    if (req.user.role === 'transporteur') throw new ForbiddenException('Accès réservé à la société.');
  }

  @Get()
  async findAll(@Request() req: any) {
    this.assertCompany(req);
    return this.transporteursService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    this.assertCompany(req);
    return this.transporteursService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    this.assertCompany(req);
    return this.transporteursService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    this.assertCompany(req);
    return this.transporteursService.update(parseInt(id), req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    this.assertCompany(req);
    return this.transporteursService.delete(parseInt(id), req.user.userId);
  }
}
