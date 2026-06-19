import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IaService } from './ia.service';

@Controller('ia')
@UseGuards(JwtAuthGuard)
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Get('chat/history')
  async getChatHistory(@Request() req: any) {
    return this.iaService.getChatHistory(req.user.userId);
  }

  @Post('chat/save')
  async saveChatMessage(@Request() req: any, @Body() body: { role: string; content: string }) {
    return this.iaService.saveChatMessage(req.user.userId, body.role, body.content);
  }

  @Get('alerts')
  async getAlerts(@Request() req: any) {
    return this.iaService.getAlerts(req.user.userId);
  }

  @Get('stats/compare')
  async getComparisonStats(@Request() req: any) {
    return this.iaService.getComparisonStats(req.user.userId);
  }

  @Get('export/analytics')
  async exportAnalytics(@Request() req: any) {
    return this.iaService.exportAnalytics(req.user.userId);
  }

  @Get('predictions')
  async getPredictions(@Request() req: any) {
    return this.iaService.getPredictions(req.user.userId);
  }

  @Get('forecast')
  async getForecast(@Request() req: any, @Query('period') period?: string, @Query('scenario') scenario?: string) {
    return this.iaService.getForecast(req.user.userId, period, scenario);
  }
}
