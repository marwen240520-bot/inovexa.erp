import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
export declare class DashboardService {
    private saleRepository;
    private purchaseRepository;
    private productRepository;
    private clientRepository;
    private orderRepository;
    constructor(saleRepository: Repository<Sale>, purchaseRepository: Repository<Purchase>, productRepository: Repository<Product>, clientRepository: Repository<Client>, orderRepository: Repository<Order>);
    getDashboardStats(userId: number, period?: string): Promise<{
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
    getSalesData(userId: number, period?: string): Promise<{
        month: string;
        sales: any;
    }[]>;
    getTopProducts(userId: number): Promise<{
        name: string;
        amount: number;
    }[]>;
    getTopClients(userId: number): Promise<{
        name: string;
        amount: number;
    }[]>;
    getKPIs(userId: number): Promise<{
        totalSales: number;
        avgOrderValue: number;
        conversionRate: number;
    }>;
    getRecentActivities(userId: number): Promise<{
        type: string;
        id: number;
        status: string;
        date: Date;
    }[]>;
}
