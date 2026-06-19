import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req: any, @Query('period') period?: string) {
    return this.dashboardService.getDashboardStats(req.user.userId, period);
  }

  @Get('sales-data')
  async getSalesData(@Request() req: any, @Query('period') period?: string) {
    return this.dashboardService.getSalesData(req.user.userId, period);
  }

  @Get('top-products')
  async getTopProducts(@Request() req: any) {
    return this.dashboardService.getTopProducts(req.user.userId);
  }

  @Get('top-clients')
  async getTopClients(@Request() req: any) {
    return this.dashboardService.getTopClients(req.user.userId);
  }

  @Get('kpis')
  async getKPIs(@Request() req: any) {
    return this.dashboardService.getKPIs(req.user.userId);
  }

  @Get('recent-activities')
  async getRecentActivities(@Request() req: any) {
    return this.dashboardService.getRecentActivities(req.user.userId);
  }
}
