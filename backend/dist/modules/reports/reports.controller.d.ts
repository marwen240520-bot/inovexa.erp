import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSalesReport(req: any, start?: string, end?: string): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        count: number;
        items: import("../sales/entities/sale.entity").Sale[];
    }>;
    getInventoryReport(req: any): Promise<{
        type: string;
        generatedAt: Date;
        totalProducts: number;
        totalValue: number;
        items: import("../products/product.entity").Product[];
    }>;
    getClientsReport(req: any): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        items: import("../clients/entities/client.entity").Client[];
    }>;
    getEmployeesReport(req: any): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        totalSalary: number;
        items: import("../employees/entities/employee.entity").Employee[];
    }>;
    getLogisticsReport(req: any): Promise<{
        type: string;
        generatedAt: Date;
        total: number;
        items: any[];
    }>;
    getSavedReports(req: any): Promise<any[]>;
    saveReport(req: any, body: {
        name: string;
        type: string;
        data: any;
    }): Promise<{
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
    deleteSavedReport(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
