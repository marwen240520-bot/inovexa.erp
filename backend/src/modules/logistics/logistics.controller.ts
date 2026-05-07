import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LogisticsService } from './logistics.service';

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('client/shipments')
  async getClientShipments(@Request() req: any) {
    if (req.user.role !== 'client') {
      return { error: 'Accès réservé aux clients' };
    }
    return this.logisticsService.findAllByClient(req.user.userId);
  }

  @Get('transporteur/shipments')
  async getTransporteurShipments(@Request() req: any) {
    if (req.user.role !== 'transporteur') {
      return { error: 'Accès réservé aux transporteurs' };
    }
    return this.logisticsService.findAllByTransporteur(req.user.userId);
  }

  @Post('client/shipments')
  async create(@Request() req: any, @Body() body: any) {
    if (req.user.role !== 'client') {
      return { error: 'Seuls les clients peuvent créer des expéditions' };
    }
    return this.logisticsService.create(req.user.userId, body);
  }

  // ⭐ AJOUTER CET ENDPOINT POUR MODIFIER UNE EXPÉDITION
  @Put('client/shipments/:id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    if (req.user.role !== 'client') {
      return { error: 'Seuls les clients peuvent modifier leurs expéditions' };
    }
    return this.logisticsService.update(parseInt(id), req.user.userId, body);
  }

  @Patch('client/shipments/:id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.logisticsService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Patch('client/shipments/:id/assign')
  async assignToTransporteur(@Param('id') id: string, @Request() req: any, @Body() body: { transporteurId: number }) {
    return this.logisticsService.assignToTransporteur(parseInt(id), req.user.userId, body.transporteurId);
  }

  @Delete('client/shipments/:id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.logisticsService.delete(parseInt(id), req.user.userId);
  }

  @Patch('transporteur/shipments/:id/status')
  async updateStatusByTransporteur(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    if (req.user.role !== 'transporteur') {
      return { error: 'Accès réservé aux transporteurs' };
    }
    return this.logisticsService.updateStatusByTransporteur(parseInt(id), req.user.userId, body.status);
  }
}