import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.create(userId, body);
  }

  // ⭐ ENDPOINT POUR L'IMPORT MULTIPLE
  @Post('import')
  async importClients(@Request() req: any, @Body() body: { clients: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.clients?.length, 'clients pour user', userId);
    return this.clientsService.importClients(userId, body.clients || []);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.update(parseInt(id), userId, body);
  }

  // ⭐ ENDPOINT POUR LE CHANGEMENT DE STATUT
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.updateStatus(parseInt(id), userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.clientsService.delete(parseInt(id), userId);
  }
}