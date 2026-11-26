import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsService } from '../auth/permissions.service';
import { ReportsService } from './reports.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Rapports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService, private readonly permissions: PermissionsService) {}

  @Get('sales')
  async getSalesReport(@Request() req: any, @Query('start') start?: string, @Query('end') end?: string) {
    return this.reportsService.getSalesReport(req.user.userId, start, end);
  }

  @Get('inventory')
  async getInventoryReport(@Request() req: any) {
    return this.reportsService.getInventoryReport(req.user.userId);
  }

  @Get('clients')
  async getClientsReport(@Request() req: any) {
    return this.reportsService.getClientsReport(req.user.userId);
  }

  @Get('employees')
  async getEmployeesReport(@Request() req: any) {
    // Le droit « rapports » ne donne pas accès aux salaires : il faut aussi le droit RH (le propriétaire l'a toujours).
    const { role, permissions, isTeamMember } = req.user;
    const withSalaries = this.permissions.can(role, permissions, 'hr:view', !!isTeamMember);
    return this.reportsService.getEmployeesReport(req.user.userId, withSalaries);
  }

  @Get('logistics')
  async getLogisticsReport(@Request() req: any) {
    return this.reportsService.getLogisticsReport(req.user.userId);
  }

  @Get('saved')
  async getSavedReports(@Request() req: any) {
    return this.reportsService.getSavedReports(req.user.userId);
  }

  @Post('saved')
  async saveReport(@Request() req: any, @Body() body: { name: string; type: string; data: any }) {
    return this.reportsService.saveReport(req.user.userId, body?.name, body?.type, body?.data);
  }

  @Delete('saved/:id')
  async deleteSavedReport(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.reportsService.deleteSavedReport(id, req.user.userId);
  }
}
