import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSalesReport(@Request() req: any) {
    return this.reportsService.getSalesReport(req.user.userId);
  }

  @Get('inventory')
  async getInventoryReport(@Request() req: any) {
    return this.reportsService.getInventoryReport(req.user.userId);
  }
}
