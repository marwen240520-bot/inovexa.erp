import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Budget } from './entities/budget.entity';
import { BankAccount } from './entities/bank-account.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  // Expenses
  async getExpenses(userId: number, year?: number, month?: number) {
    let where: any = { userId };
    if (year !== undefined && month !== undefined) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      where.date = Between(start, end);
    } else if (year !== undefined) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      where.date = Between(start, end);
    }
    return this.expenseRepository.find({ where, order: { date: 'DESC' } });
  }

  async addExpense(userId: number, data: Partial<Expense>) {
    const expense = this.expenseRepository.create({ ...data, userId });
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: number, userId: number) {
    await this.expenseRepository.delete({ id, userId });
    return { success: true };
  }

  // Budgets
  async getBudgets(userId: number, year: number) {
    return this.budgetRepository.find({ where: { userId, year } });
  }

  async setBudget(userId: number, data: { category: string; amount: number; year: number; department?: string }) {
    const existing = await this.budgetRepository.findOne({
      where: { 
        userId, 
        category: data.category, 
        year: data.year, 
        department: data.department || 'all' 
      }
    });
    
    if (existing) {
      existing.amount = data.amount;
      return this.budgetRepository.save(existing);
    }
    
    const budget = this.budgetRepository.create({ 
      userId, 
      category: data.category, 
      amount: data.amount, 
      year: data.year, 
      department: data.department || 'all' 
    });
    return this.budgetRepository.save(budget);
  }

  // Bank Accounts
  async getBankAccounts(userId: number) {
    return this.bankAccountRepository.find({ where: { userId } });
  }

  async addBankAccount(userId: number, data: Partial<BankAccount>) {
    const account = this.bankAccountRepository.create({ ...data, userId });
    return this.bankAccountRepository.save(account);
  }

  async deleteBankAccount(id: number, userId: number) {
    await this.bankAccountRepository.delete({ id, userId });
    return { success: true };
  }

  async getFinancialStats(userId: number, year: number, month?: number) {
    const expenses = await this.getExpenses(userId, year, month);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + (e.amount || 0);
    });
    const bankAccounts = await this.getBankAccounts(userId);
    const totalCash = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    return { totalExpenses, expensesByCategory, totalCash, bankAccounts };
  }
}
