import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    findAll(req: any): Promise<import("./entities/invoice.entity").Invoice[]>;
    findOne(id: string, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    findByOperationNumber(operationNumber: string, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    create(req: any, body: any): Promise<import("./entities/invoice.entity").Invoice>;
    update(id: string, req: any, body: any): Promise<import("./entities/invoice.entity").Invoice>;
    markAsPaid(id: string, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    markAsPaidByOperationNumber(operationNumber: string, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getStats(req: any): Promise<{
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
