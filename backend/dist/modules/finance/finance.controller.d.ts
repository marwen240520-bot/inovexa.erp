import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getExpenses(req: any, year: string, month: string): Promise<import("./entities/expense.entity").Expense[]>;
    addExpense(req: any, body: any): Promise<import("./entities/expense.entity").Expense>;
    deleteExpense(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getBudgets(req: any, year: string): Promise<import("./entities/budget.entity").Budget[]>;
    setBudget(req: any, body: any): Promise<import("./entities/budget.entity").Budget>;
    getBankAccounts(req: any): Promise<import("./entities/bank-account.entity").BankAccount[]>;
    addBankAccount(req: any, body: any): Promise<import("./entities/bank-account.entity").BankAccount>;
    deleteBankAccount(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getFinancialStats(req: any, year: string, month: string): Promise<{
        totalExpenses: number;
        expensesByCategory: Record<string, number>;
        totalCash: number;
        bankAccounts: import("./entities/bank-account.entity").BankAccount[];
    }>;
}
