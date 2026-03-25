import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboardData();
  }

  @Get('financial')
  getFinancialReport() {
    return this.analyticsService.getFinancialMetrics();
  }

  @Get('inventory')
  getInventoryReport() {
    return this.analyticsService.getInventoryMetrics();
  }

  @Get('hr')
  getHrReport() {
    return this.analyticsService.getHrMetrics();
  }

  @Get('sales')
  getSalesReport() {
    return this.analyticsService.getSalesMetrics();
  }
}
