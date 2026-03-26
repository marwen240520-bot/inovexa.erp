import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(employeeId);
  }

  @Get('employee/:employeeId/average')
  getAverage(@Param('employeeId') employeeId: string) {
    return this.service.getAverageRating(employeeId);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: any) {
    return this.service.create(data);
  }
}
