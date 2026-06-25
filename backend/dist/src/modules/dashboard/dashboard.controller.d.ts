import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(req: any, period?: string): Promise<{
        summary: {
            totalSales: number;
            totalPurchases: number;
            profit: number;
            margin: number;
        };
        stats: {
            totalClients: number;
            totalProducts: number;
            pendingOrders: number;
        };
        growth: {
            sales: number;
            clients: number;
            profit: number;
        };
    }>;
    getSalesData(req: any, period?: string): Promise<{
        month: string;
        sales: any;
    }[]>;
    getTopProducts(req: any): Promise<{
        name: string;
        amount: number;
    }[]>;
    getTopClients(req: any): Promise<{
        name: string;
        amount: number;
    }[]>;
    getKPIs(req: any): Promise<{
        totalSales: number;
        avgOrderValue: number;
        conversionRate: number;
    }>;
    getRecentActivities(req: any): Promise<{
        type: string;
        id: number;
        status: string;
        date: Date;
    }[]>;
}
