import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Employee } from '../employees/entities/employee.entity';
export declare class ReportsService {
    private saleRepository;
    private productRepository;
    private clientRepository;
    private employeeRepository;
    private savedReports;
    constructor(saleRepository: Repository<Sale>, productRepository: Repository<Product>, clientRepository: Repository<Client>, employeeRepository: Repository<Employee>);
    getSalesReport(userId: number, start?: string, end?: string): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        count: number;
        items: Sale[];
    }>;
    getInventoryReport(userId: number): Promise<{
        type: string;
        generatedAt: Date;
        totalProducts: number;
        totalValue: number;
        items: Product[];
    }>;
    getClientsReport(userId: number): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        items: Client[];
    }>;
    getEmployeesReport(userId: number): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        totalSalary: number;
        items: Employee[];
    }>;
    getLogisticsReport(userId: number): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        items: any[];
    }>;
    getSavedReports(userId: number): Promise<any[]>;
    saveReport(userId: number, name: string, type: string, data: any): Promise<{
        success: boolean;
        message: string;
        report: {
            id: number;
            userId: number;
            name: string;
            type: string;
            data: any;
            createdAt: Date;
        };
    }>;
    deleteSavedReport(id: number, userId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
