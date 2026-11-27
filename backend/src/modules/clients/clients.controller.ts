import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { ClientStatusDto, CreateClientDto, UpdateClientDto } from './clients.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientsService.findOne(id, req.user.userId);
  }

  // ⚠️ Route d'import : le front appelle POST /clients/import
  @Post('import')
  async importClients(@Request() req: any, @Body() body: { clients: any[] }) {
    return this.clientsService.importClients(req.user.userId, body?.clients);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateClientDto) {
    return this.clientsService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: UpdateClientDto) {
    return this.clientsService.update(id, req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: ClientStatusDto) {
    return this.clientsService.updateStatus(id, req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.clientsService.delete(id, req.user.userId);
  }
}
