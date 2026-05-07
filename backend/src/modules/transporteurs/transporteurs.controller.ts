import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransporteursService } from './transporteurs.service';

@Controller('transporteurs')
@UseGuards(JwtAuthGuard)
export class TransporteursController {
  constructor(private readonly transporteursService: TransporteursService) {}

  @Get()
  async getAll(@Request() req: any) {
    // Pour admin: voir tous les transporteurs
    if (req.user.role === 'admin') {
      return this.transporteursService.findAll();
    }
    // Pour client: voir ses propres transporteurs
    const clientId = req.user.clientId || req.user.userId;
    return this.transporteursService.getByClientId(clientId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Request() req: any) {
    const transporteur = await this.transporteursService.findOne(parseInt(id));
    
    // Vérifier les droits d'accès
    if (req.user.role !== 'admin' && transporteur.clientId !== (req.user.clientId || req.user.userId)) {
      throw new Error('Accès non autorisé');
    }
    
    return transporteur;
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const clientId = req.user.clientId || req.user.userId;
    const result = await this.transporteursService.create(clientId, body);
    
    // ⭐ CORRECTION: Retourner un objet avec message et data
    if (result.temporaryPassword) {
      return {
        success: true,
        message: `Transporteur créé avec succès. Mot de passe temporaire: ${result.temporaryPassword}`,
        data: result
      };
    }
    
    return {
      success: true,
      message: 'Transporteur créé avec succès',
      data: result
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const clientId = req.user.clientId || req.user.userId;
    const result = await this.transporteursService.update(parseInt(id), clientId, body);
    return {
      success: true,
      message: 'Transporteur modifié avec succès',
      data: result
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const clientId = req.user.clientId || req.user.userId;
    const result = await this.transporteursService.delete(parseInt(id), clientId);
    return {
      success: true,
      message: result.message || 'Transporteur supprimé avec succès'
    };
  }
}