import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, EmployeeStatusDto, UpdateEmployeeDto } from './employees.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Employés')
@ApiBearerAuth()
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
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.employeesService.findOne(id, req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateEmployeeDto) {
    return this.employeesService.create(req.user.userId, body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: UpdateEmployeeDto) {
    return this.employeesService.update(id, req.user.userId, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: EmployeeStatusDto) {
    return this.employeesService.updateStatus(id, req.user.userId, body.status);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.employeesService.delete(id, req.user.userId);
  }

  @Post('import')
  async importEmployees(@Request() req: any, @Body() body: { employees: any[] }) {
    return this.employeesService.importEmployees(req.user.userId, body.employees);
  }
}
