import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.departmentsService.findAll(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.departmentsService.create(req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.departmentsService.delete(parseInt(id), req.user.userId);
  }
}
