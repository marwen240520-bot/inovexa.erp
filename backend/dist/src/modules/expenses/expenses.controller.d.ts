import { ExpensesService } from './expenses.service';
export declare class ExpensesController {
    private readonly expensesService;
    constructor(expensesService: ExpensesService);
    findAll(req: any): Promise<import("./entities/expense.entity").Expense[]>;
    create(req: any, body: any): Promise<import("./entities/expense.entity").Expense>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
