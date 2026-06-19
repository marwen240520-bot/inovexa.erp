import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
export declare class AnalyticsService {
    private saleRepository;
    private purchaseRepository;
    private productRepository;
    private clientRepository;
    private orderRepository;
    private invoiceRepository;
    constructor(saleRepository: Repository<Sale>, purchaseRepository: Repository<Purchase>, productRepository: Repository<Product>, clientRepository: Repository<Client>, orderRepository: Repository<Order>, invoiceRepository: Repository<Invoice>);
    getDashboardStats(userId: number, period?: string): Promise<{
        totalSales: number;
        totalPurchases: number;
        profit: number;
        margin: number;
    }>;
    getInventoryAnalytics(userId: number): Promise<{
        totalProducts: number;
        lowStock: number;
        outOfStock: number;
        totalValue: number;
    }>;
    getClientsAnalytics(userId: number): Promise<{
        total: number;
        active: number;
        totalSpent: number;
    }>;
    getOrderAnalytics(userId: number): Promise<{
        total: number;
        pending: number;
        completed: number;
        totalAmount: number;
    }>;
    getTrends(userId: number, period?: string): Promise<{
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
    getAlerts(userId: number): Promise<{
        type: string;
        message: string;
    }[]>;
    getKPIs(userId: number): Promise<{
        totalSales: number;
        avgOrderValue: number;
        conversionRate: number;
    }>;
}
