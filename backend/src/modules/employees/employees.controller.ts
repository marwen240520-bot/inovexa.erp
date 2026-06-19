import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.employeesService.findAll(req.user.userId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    return this.employeesService.getStats(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.employeesService.findOne(parseInt(id), req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.employeesService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.employeesService.update(parseInt(id), req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Request() req: any, @Body() body: { status: string }) {
    return this.employeesService.updateStatus(parseInt(id), req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.employeesService.delete(parseInt(id), req.user.userId);
  }

  @Post('import')
  async importEmployees(@Request() req: any, @Body() body: { employees: any[] }) {
    return this.employeesService.importEmployees(req.user.userId, body.employees);
  }
}
