import { IaService } from './ia.service';
export declare class IaController {
    private readonly iaService;
    constructor(iaService: IaService);
    getChatHistory(req: any): Promise<import("./entities/ia-chat.entity").IaChat[]>;
    saveChatMessage(req: any, body: {
        role: string;
        content: string;
    }): Promise<import("./entities/ia-chat.entity").IaChat>;
    getAlerts(req: any): Promise<any[]>;
    getComparisonStats(req: any): Promise<{
        salesGrowth: number;
        clientGrowth: number;
        profitGrowth: number;
        avgOrderGrowth: number;
    }>;
    exportAnalytics(req: any): Promise<{
        generatedAt: Date;
        message: string;
    }>;
    getPredictions(req: any): Promise<{
        nextMonthSales: number;
        growthRate: number;
        confidence: number;
    }>;
    getForecast(req: any, period?: string, scenario?: string): Promise<{
        forecast: number[];
        period: string;
        scenario: string;
    }>;
}
