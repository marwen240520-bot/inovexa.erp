import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.employeesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.employeesService.findOne(parseInt(id), userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.employeesService.create(userId, body);
  }

  // ⭐ AJOUTER L'ENDPOINT D'IMPORT
  @Post('import')
  async importEmployees(@Request() req: any, @Body() body: { employees: any[] }) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    console.log('📥 Import de', body.employees?.length, 'employés pour user', userId);
    return this.employeesService.importEmployees(userId, body.employees || []);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.employeesService.update(parseInt(id), userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    return this.employeesService.delete(parseInt(id), userId);
  }
}