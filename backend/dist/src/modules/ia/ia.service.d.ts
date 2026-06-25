import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { IaChat } from './entities/ia-chat.entity';
export declare class IaService {
    private saleRepository;
    private purchaseRepository;
    private productRepository;
    private clientRepository;
    private orderRepository;
    private invoiceRepository;
    private iaChatRepository;
    constructor(saleRepository: Repository<Sale>, purchaseRepository: Repository<Purchase>, productRepository: Repository<Product>, clientRepository: Repository<Client>, orderRepository: Repository<Order>, invoiceRepository: Repository<Invoice>, iaChatRepository: Repository<IaChat>);
    getChatHistory(userId: number): Promise<IaChat[]>;
    saveChatMessage(userId: number, role: string, content: string): Promise<IaChat>;
    getAlerts(userId: number): Promise<any[]>;
    getComparisonStats(userId: number): Promise<{
        salesGrowth: number;
        clientGrowth: number;
        profitGrowth: number;
        avgOrderGrowth: number;
    }>;
    exportAnalytics(userId: number): Promise<{
        generatedAt: Date;
        message: string;
    }>;
    getPredictions(userId: number): Promise<{
        nextMonthSales: number;
        growthRate: number;
        confidence: number;
    }>;
    getForecast(userId: number, period?: string, scenario?: string): Promise<{
        forecast: number[];
        period: string;
        scenario: string;
    }>;
}
