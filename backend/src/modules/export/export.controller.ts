import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('excel/:type')
  @Roles('admin')
  async exportExcel(@Param('type') type: string, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(type);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_export.xlsx`);
    res.send(buffer);
  }

  @Get('pdf/:type')
  @Roles('admin')
  async exportPDF(@Param('type') type: string, @Res() res: Response) {
    const buffer = await this.service.exportToPDF(type);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_export.pdf`);
    res.send(buffer);
  }
}
