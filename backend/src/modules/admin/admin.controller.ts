import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('clients')
  async getAllClients(@Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.getAllClients();
  }

  @Get('clients/:id')
  async getClientById(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.getClientById(parseInt(id));
  }

  @Get('users/:id/modules')
  async getClientModules(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.getClientModules(parseInt(id));
  }

  @Patch('clients/:id/modules')
  async updateClientModules(
    @Param('id') id: string, 
    @Request() req: any, 
    @Body() body: { modules: Record<string, boolean> }
  ) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.updateClientModules(parseInt(id), body.modules);
  }

  @Post('clients')
  async createClient(@Request() req: any, @Body() body: {
    email: string;
    password: string;
    name: string;
    companyName: string;
    phone?: string;
    subscriptionDuration: number;
  }) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.createClient(body);
  }

  @Patch('clients/:id')
  async updateClient(@Param('id') id: string, @Request() req: any, @Body() body: {
    name?: string;
    companyName?: string;
    phone?: string;
    subscriptionEnd?: Date;
    isActive?: boolean;
  }) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.updateClient(parseInt(id), body);
  }

  @Patch('clients/:id/extend')
  async extendSubscription(@Param('id') id: string, @Request() req: any, @Body() body: { days: number }) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.extendSubscription(parseInt(id), body.days);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.deleteClient(parseInt(id));
  }

  @Patch('clients/:id/toggle')
  async toggleClientStatus(@Param('id') id: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.toggleClientStatus(parseInt(id));
  }

  @Get('stats')
  async getAdminStats(@Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Accès non autorisé' };
    }
    return this.adminService.getAdminStats();
  }
}
