import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(userId: number) {
    return this.expenseRepository.find({ where: { userId }, order: { date: 'DESC' } });
  }

  async create(userId: number, data: Partial<Expense>) {
    const expense = this.expenseRepository.create({ ...data, userId });
    return this.expenseRepository.save(expense);
  }

  async delete(id: number, userId: number) {
    const expense = await this.expenseRepository.findOne({ where: { id, userId } });
    if (!expense) throw new NotFoundException('Dépense non trouvée');
    await this.expenseRepository.delete(id);
    return { success: true };
  }
}
