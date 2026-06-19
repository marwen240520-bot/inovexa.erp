import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
export declare class ExpensesService {
    private expenseRepository;
    constructor(expenseRepository: Repository<Expense>);
    findAll(userId: number): Promise<Expense[]>;
    create(userId: number, data: Partial<Expense>): Promise<Expense>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
}
