import { Controller, Get, Patch, Param, Body, UseGuards, Request, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransporteurService } from './transporteur.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/** Compte de connexion du transporteur (jamais l'identifiant d'une société). */
const account = (req: any): number => req.user.actorId ?? req.user.userId;

@ApiTags('Transporteur')
@ApiBearerAuth()
@Controller('transporteur')
@UseGuards(JwtAuthGuard)
export class TransporteurController {
  constructor(private readonly transporteurService: TransporteurService) {}

  private assertTransporteur(req: any) {
    if (req.user.role !== 'transporteur') throw new ForbiddenException('Accès réservé aux transporteurs.');
  }

  @Get('shipments')
  async getMyShipments(@Request() req: any) {
    this.assertTransporteur(req);
    return this.transporteurService.getMyShipments(account(req));
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    this.assertTransporteur(req);
    return this.transporteurService.getStats(account(req));
  }

  @Patch('shipments/:id/status')
  async updateShipmentStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: { status: string }) {
    this.assertTransporteur(req);
    return this.transporteurService.updateShipmentStatus(id, account(req), body?.status);
  }
}
