import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    // Ajouter userId au body
    body.userId = req.user.userId;
    return this.clientsService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.clientsService.update(parseInt(id), req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.clientsService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.delete(parseInt(id), req.user.userId);
  }
}
