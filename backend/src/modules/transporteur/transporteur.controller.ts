import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransporteurService } from './transporteur.service';

@Controller('transporteur')
@UseGuards(JwtAuthGuard)
export class TransporteurController {
  constructor(private readonly transporteurService: TransporteurService) {}

  @Get('shipments')
  async getMyShipments(@Request() req: any) {
    if (req.user.role !== 'transporteur') {
      return { error: 'Accès non autorisé' };
    }
    return this.transporteurService.getMyShipments(req.user.userId);
  }

  @Patch('shipments/:id/status')
  async updateShipmentStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    if (req.user.role !== 'transporteur') {
      return { error: 'Accès non autorisé' };
    }
    return this.transporteurService.updateShipmentStatus(parseInt(id), req.user.userId, body.status);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    if (req.user.role !== 'transporteur') {
      return { error: 'Accès non autorisé' };
    }
    return this.transporteurService.getStats(req.user.userId);
  }
}
