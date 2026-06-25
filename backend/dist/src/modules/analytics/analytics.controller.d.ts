import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(req: any, period?: string): Promise<{
        totalSales: number;
        totalPurchases: number;
        profit: number;
        margin: number;
    }>;
    getInventoryAnalytics(req: any): Promise<{
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        totalValue: number;
    }>;
    getClientsAnalytics(req: any): Promise<{
        total: number;
        active: number;
        totalSpent: number;
    }>;
    getOrderAnalytics(req: any): Promise<{
        total: number;
        pending: number;
        completed: number;
        totalAmount: number;
    }>;
    getTrends(req: any, period?: string): Promise<{
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
    getAlerts(req: any): Promise<{
        type: string;
        message: string;
    }[]>;
    getKPIs(req: any): Promise<{
        totalSales: number;
        avgOrderValue: number;
        conversionRate: number;
    }>;
}
