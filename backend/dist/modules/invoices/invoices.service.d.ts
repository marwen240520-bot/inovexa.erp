import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
export declare class InvoicesService {
    private invoiceRepository;
    constructor(invoiceRepository: Repository<Invoice>);
    private getValidDate;
    findAll(userId: number): Promise<Invoice[]>;
    findByOperationNumber(operationNumber: string, userId: number): Promise<Invoice>;
    findOne(id: number, userId: number): Promise<Invoice>;
    create(userId: number, data: any): Promise<Invoice>;
    update(id: number, userId: number, data: any): Promise<Invoice>;
    markAsPaid(id: number, userId: number): Promise<Invoice>;
    markAsPaidByOperationNumber(operationNumber: string, userId: number): Promise<Invoice>;
    delete(id: number, userId: number): Promise<{
        success: boolean;
    }>;
    getStats(userId: number): Promise<{
        total: number;
        paid: number;
        pending: number;
        totalAmount: number;
        paidAmount: number;
        pendingAmount: number;
        totalTax: number;
        debitTotal: number;
        creditTotal: number;
        monthlyTotal: number;
        quarterlyTotal: number;
        yearlyTotal: number;
    }>;
}
