import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../saas/admin.guard';
import { AdminService } from './admin.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Gestion des comptes clients par l'administrateur de la plateforme.
 * AdminGuard répond 403 à tout autre rôle (auparavant : 200 avec { error }, que le journal d'audit prenait pour un succès).
 * Abonnements, formules, paiements, secteurs : voir modules/saas (même préfixe /admin).
 */
@ApiTags('Administration plateforme')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('clients')
  async getAllClients() {
    return this.adminService.getAllClients();
  }

  @Get('clients/:id')
  async getClientById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getClientById(id);
  }

  @Get('users/:id/modules')
  async getClientModules(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getClientModules(id);
  }

  @Patch('clients/:id/modules')
  async updateClientModules(@Param('id', ParseIntPipe) id: number, @Body() body: { modules: Record<string, boolean> }) {
    return this.adminService.updateClientModules(id, body?.modules);
  }

  @Post('clients')
  async createClient(@Body() body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
    sector?: string;
    subscriptionDuration: number;
    seedDemoData?: boolean;
  }) {
    return this.adminService.createClient(body);
  }

  @Patch('clients/:id')
  async updateClient(@Param('id', ParseIntPipe) id: number, @Body() body: {
    name?: string;
    companyName?: string;
    phone?: string;
    subscriptionEnd?: Date;
    isActive?: boolean;
  }) {
    return this.adminService.updateClient(id, body);
  }

  @Patch('clients/:id/extend')
  async extendSubscription(@Param('id', ParseIntPipe) id: number, @Body() body: { days: number }) {
    return this.adminService.extendSubscription(id, body?.days);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteClient(id);
  }

  @Post('clients/:id/reset-demo-data')
  async resetDemoData(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.resetDemoData(id);
  }

  @Delete('clients/:id/demo-data')
  async clearDemoData(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.clearDemoData(id);
  }

  @Patch('clients/:id/toggle')
  async toggleClientStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleClientStatus(id);
  }

  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }
}
