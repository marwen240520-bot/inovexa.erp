import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
    return this.reportsService.getEmployeesReport(req.user.userId);
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
    return this.reportsService.saveReport(req.user.userId, body.name, body.type, body.data);
  }

  @Delete('saved/:id')
  async deleteSavedReport(@Param('id') id: string, @Request() req: any) {
    return this.reportsService.deleteSavedReport(parseInt(id), req.user.userId);
  }
}
