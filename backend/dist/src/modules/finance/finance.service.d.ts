import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { Budget } from './entities/budget.entity';
import { BankAccount } from './entities/bank-account.entity';
export declare class FinanceService {
    private expenseRepository;
    private budgetRepository;
    private bankAccountRepository;
    constructor(expenseRepository: Repository<Expense>, budgetRepository: Repository<Budget>, bankAccountRepository: Repository<BankAccount>);
    getExpenses(userId: number, year?: number, month?: number): Promise<Expense[]>;
    addExpense(userId: number, data: Partial<Expense>): Promise<Expense>;
    deleteExpense(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getBudgets(userId: number, year: number): Promise<Budget[]>;
    setBudget(userId: number, data: {
        category: string;
        amount: number;
        year: number;
        department?: string;
    }): Promise<Budget>;
    getBankAccounts(userId: number): Promise<BankAccount[]>;
    addBankAccount(userId: number, data: Partial<BankAccount>): Promise<BankAccount>;
    deleteBankAccount(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getFinancialStats(userId: number, year: number, month?: number): Promise<{
        totalExpenses: number;
        expensesByCategory: Record<string, number>;
        totalCash: number;
        bankAccounts: BankAccount[];
    }>;
}
