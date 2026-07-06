import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Client } from '../clients/entities/client.entity';
import { Supplier } from '../suppliers/supplier.entity';
export declare class InvoicesService {
    private invoiceRepository;
    private clientRepository;
    private supplierRepository;
    constructor(invoiceRepository: Repository<Invoice>, clientRepository: Repository<Client>, supplierRepository: Repository<Supplier>);
    private toIntOrNull;
    private findOrCreateClient;
    private findOrCreateSupplier;
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
