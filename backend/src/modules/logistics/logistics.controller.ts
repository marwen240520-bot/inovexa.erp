import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogisticsService } from './logistics.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Logistique')
@ApiBearerAuth()
@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  /** Routes de la société : propriétaire et membres d'équipe (leurs droits sont contrôlés par AccessGuard), jamais un transporteur. */
  private assertCompany(req: any) {
    if (req.user.role === 'transporteur') throw new ForbiddenException('Accès réservé à la société.');
  }

  private assertTransporteur(req: any) {
    if (req.user.role !== 'transporteur') throw new ForbiddenException('Accès réservé aux transporteurs.');
  }

  // GET /logistics/shipments -> liste selon le role (société / transporteur)
  @Get('shipments')
  async getShipments(@Request() req: any) {
    if (req.user.role === 'transporteur') {
      return this.logisticsService.findAllByTransporteurAccount(req.user.actorId ?? req.user.userId);
    }
    return this.logisticsService.findAllByClient(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    this.assertCompany(req);
    return this.logisticsService.stats(req.user.userId);
  }

  @Get('client/shipments')
  async getClientShipments(@Request() req: any) {
    this.assertCompany(req);
    return this.logisticsService.findAllByClient(req.user.userId);
  }

  @Get('transporteur/shipments')
  async getTransporteurShipments(@Request() req: any) {
    this.assertTransporteur(req);
    return this.logisticsService.findAllByTransporteurAccount(req.user.actorId ?? req.user.userId);
  }

  @Get('client/shipments/:id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    this.assertCompany(req);
    return this.logisticsService.findOne(id, req.user.userId);
  }

  @Post('client/shipments')
  async create(@Request() req: any, @Body() body: any) {
    this.assertCompany(req);
    return this.logisticsService.create(req.user.userId, body);
  }

  @Put('client/shipments/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: any) {
    this.assertCompany(req);
    return this.logisticsService.update(id, req.user.userId, body);
  }

  @Patch('client/shipments/:id/assign')
  async assignToTransporteur(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: { transporteurId: number }) {
    this.assertCompany(req);
    return this.logisticsService.assignToTransporteur(id, req.user.userId, body?.transporteurId);
  }

  @Patch('client/shipments/:id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: { status: string }) {
    this.assertCompany(req);
    return this.logisticsService.updateStatus(id, req.user.userId, body?.status);
  }

  @Patch('transporteur/shipments/:id/status')
  async updateStatusByTransporteur(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: { status: string }) {
    this.assertTransporteur(req);
    return this.logisticsService.updateStatusByTransporteurAccount(id, req.user.actorId ?? req.user.userId, body?.status);
  }

  @Delete('client/shipments/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    this.assertCompany(req);
    return this.logisticsService.delete(id, req.user.userId);
  }
}
