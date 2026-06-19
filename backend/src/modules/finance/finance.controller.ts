import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Expenses
  @Get('expenses')
  async getExpenses(@Request() req: any, @Query('year') year: string, @Query('month') month: string) {
    return this.financeService.getExpenses(req.user.userId, year ? parseInt(year) : undefined, month ? parseInt(month) : undefined);
  }

  @Post('expenses')
  async addExpense(@Request() req: any, @Body() body: any) {
    return this.financeService.addExpense(req.user.userId, body);
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string, @Request() req: any) {
    return this.financeService.deleteExpense(parseInt(id), req.user.userId);
  }

  // Budgets
  @Get('budgets')
  async getBudgets(@Request() req: any, @Query('year') year: string) {
    return this.financeService.getBudgets(req.user.userId, parseInt(year));
  }

  @Post('budgets')
  async setBudget(@Request() req: any, @Body() body: any) {
    return this.financeService.setBudget(req.user.userId, body);
  }

  // Bank Accounts
  @Get('accounts')
  async getBankAccounts(@Request() req: any) {
    return this.financeService.getBankAccounts(req.user.userId);
  }

  @Post('accounts')
  async addBankAccount(@Request() req: any, @Body() body: any) {
    return this.financeService.addBankAccount(req.user.userId, body);
  }

  @Delete('accounts/:id')
  async deleteBankAccount(@Param('id') id: string, @Request() req: any) {
    return this.financeService.deleteBankAccount(parseInt(id), req.user.userId);
  }

  // Stats
  @Get('stats')
  async getFinancialStats(@Request() req: any, @Query('year') year: string, @Query('month') month: string) {
    return this.financeService.getFinancialStats(req.user.userId, parseInt(year), month ? parseInt(month) : undefined);
  }
}
