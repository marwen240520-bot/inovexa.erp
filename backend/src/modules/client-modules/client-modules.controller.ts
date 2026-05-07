import { Controller, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientModulesService } from './client-modules.service';

@Controller('client-modules')
@UseGuards(JwtAuthGuard)
export class ClientModulesController {
  constructor(private readonly clientModulesService: ClientModulesService) {}

  @Get('my-modules')
  async getMyModules(@Request() req: any) {
    return this.clientModulesService.getModulesByClient(req.user.userId);
  }

  @Get('client/:clientId')
  async getClientModules(@Param('clientId') clientId: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Unauthorized access' };
    }
    return this.clientModulesService.getModulesByClient(parseInt(clientId));
  }

  @Put('client/:clientId')
  async updateClientModules(@Param('clientId') clientId: string, @Request() req: any, @Body() body: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Unauthorized access' };
    }
    const result = await this.clientModulesService.updateModules(parseInt(clientId), body);
    return { success: true, data: result };
  }

  @Delete('client/:clientId/reset')
  async resetClientModules(@Param('clientId') clientId: string, @Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Unauthorized access' };
    }
    return this.clientModulesService.resetModules(parseInt(clientId));
  }

  @Get('all/config')
  async getAllConfig(@Request() req: any) {
    if (req.user.role !== 'admin') {
      return { error: 'Unauthorized access' };
    }
    return this.clientModulesService.getAllModulesConfig();
  }

  @Get('check/:module')
  async checkModule(@Param('module') module: string, @Request() req: any) {
    return this.clientModulesService.getModuleStatus(req.user.userId, module);
  }
}
