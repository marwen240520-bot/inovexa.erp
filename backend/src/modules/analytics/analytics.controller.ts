import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats(@Request() req: any, @Query('period') period?: string) {
    return this.analyticsService.getDashboardStats(req.user.userId, period);
  }

  @Get('inventory')
  async getInventoryAnalytics(@Request() req: any) {
    return this.analyticsService.getInventoryAnalytics(req.user.userId);
  }

  @Get('clients')
  async getClientsAnalytics(@Request() req: any) {
    return this.analyticsService.getClientsAnalytics(req.user.userId);
  }

  @Get('orders')
  async getOrderAnalytics(@Request() req: any) {
    return this.analyticsService.getOrderAnalytics(req.user.userId);
  }

  @Get('trends')
  async getTrends(@Request() req: any, @Query('period') period?: string) {
    return this.analyticsService.getTrends(req.user.userId, period);
  }

  @Get('top-products')
  async getTopProducts(@Request() req: any) {
    return this.analyticsService.getTopProducts(req.user.userId);
  }

  @Get('top-clients')
  async getTopClients(@Request() req: any) {
    return this.analyticsService.getTopClients(req.user.userId);
  }

  @Get('alerts')
  async getAlerts(@Request() req: any) {
    return this.analyticsService.getAlerts(req.user.userId);
  }

  @Get('kpis')
  async getKPIs(@Request() req: any) {
    return this.analyticsService.getKPIs(req.user.userId);
  }
}
