import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../finance/entities/expense.entity';
import { stripProtected } from '../saas/admin.guard';
import { completeExpense } from '../finance/expense-defaults';
import type { ExpenseDto } from '../finance/finance.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(userId: number) {
    return this.expenseRepository.find({ where: { userId }, order: { date: 'DESC' } });
  }

  async create(userId: number, data: Partial<Expense> | ExpenseDto) {
    const input = stripProtected(data as any) as Partial<Expense>;
    const expense = this.expenseRepository.create({ ...input, ...completeExpense(input), userId });
    return this.expenseRepository.save(expense);
  }

  async delete(id: number, userId: number) {
    const expense = await this.expenseRepository.findOne({ where: { id, userId } });
    if (!expense) throw new NotFoundException('Dépense non trouvée');
    await this.expenseRepository.delete({ id, userId });
    return { success: true };
  }
}
