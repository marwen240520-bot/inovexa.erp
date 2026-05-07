import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.expensesService.findAll(req.user.userId);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    return this.expensesService.create(req.user.userId, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.expensesService.delete(parseInt(id), req.user.userId);
  }
}
