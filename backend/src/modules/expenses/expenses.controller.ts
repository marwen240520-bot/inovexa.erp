import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import { ExpenseDto } from '../finance/finance.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Dépenses')
@ApiBearerAuth()
@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: ExpenseDto) {
    return this.expensesService.create(req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.expensesService.delete(id, req.user.userId);
  }
}
