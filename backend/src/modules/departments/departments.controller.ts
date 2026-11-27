import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './departments.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Départements')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.departmentsService.findAll(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: CreateDepartmentDto) {
    return this.departmentsService.create(req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.departmentsService.delete(id, req.user.userId);
  }
}
