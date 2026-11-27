import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';
import { BankAccountDto, BudgetDto, ExpenseDto, YearMonthQuery } from './finance.dto';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Expenses
  @Get('expenses')
  async getExpenses(@Request() req: any, @Query() q: YearMonthQuery) {
    return this.financeService.getExpenses(req.user.userId, q.year, q.month);
  }

  @Post('expenses')
  async addExpense(@Request() req: any, @Body() body: ExpenseDto) {
    return this.financeService.addExpense(req.user.userId, body, req.user.actorId ?? req.user.userId);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.financeService.deleteExpense(id, req.user.userId, req.user.actorId ?? req.user.userId);
  }

  // Budgets
  @Get('budgets')
  async getBudgets(@Request() req: any, @Query() q: YearMonthQuery) {
    // Sans année : l'année en cours (parseInt(undefined) donnait NaN, puis une erreur 500).
    return this.financeService.getBudgets(req.user.userId, q.year ?? new Date().getFullYear());
  }

  @Post('budgets')
  async setBudget(@Request() req: any, @Body() body: BudgetDto) {
    return this.financeService.setBudget(req.user.userId, body);
  }

  @Delete('budgets/:id')
  async deleteBudget(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.financeService.deleteBudget(id, req.user.userId);
  }

  // Bank Accounts
  @Get('accounts')
  async getBankAccounts(@Request() req: any) {
    return this.financeService.getBankAccounts(req.user.userId);
  }

  @Post('accounts')
  async addBankAccount(@Request() req: any, @Body() body: BankAccountDto) {
    return this.financeService.addBankAccount(req.user.userId, body);
  }

  @Delete('accounts/:id')
  async deleteBankAccount(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.financeService.deleteBankAccount(id, req.user.userId);
  }

  // Stats
  @Get('stats')
  async getFinancialStats(@Request() req: any, @Query() q: YearMonthQuery) {
    return this.financeService.getFinancialStats(req.user.userId, q.year ?? new Date().getFullYear(), q.month);
  }
}
