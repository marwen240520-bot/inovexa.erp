import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { IaChat } from './entities/ia-chat.entity';

@Injectable()
export class IaService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(IaChat)
    private iaChatRepository: Repository<IaChat>,
  ) {}

  async getChatHistory(userId: number) {
    return this.iaChatRepository.find({ where: { userId }, order: { createdAt: 'ASC' }, take: 50 });
  }

  async saveChatMessage(userId: number, role: string, content: string) {
    const message = this.iaChatRepository.create({ userId, role, content });
    return this.iaChatRepository.save(message);
  }

  async getAlerts(userId: number) {
    const products = await this.productRepository.find({ where: { userId } });
    const orders = await this.orderRepository.find({ where: { userId } });
    const invoices = await this.invoiceRepository.find({ where: { userId } });
    
    const alerts: any[] = [];
    const lowStockCount = products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
    const outOfStockCount = products.filter(p => (p.quantity || 0) === 0).length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const pendingInvoices = invoices.filter(i => i.status === "pending").length;
    
    if (lowStockCount > 0) alerts.push({ type: "warning", message: `${lowStockCount} produit(s) en stock faible` });
    if (outOfStockCount > 0) alerts.push({ type: "danger", message: `${outOfStockCount} produit(s) en rupture` });
    if (pendingOrders > 0) alerts.push({ type: "info", message: `${pendingOrders} commande(s) en attente` });
    if (pendingInvoices > 0) alerts.push({ type: "warning", message: `${pendingInvoices} facture(s) impayées` });
    
    return alerts;
  }

  async getComparisonStats(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const currentMonth = new Date().getMonth();
    const currentMonthSales = sales.filter(s => new Date(s.createdAt).getMonth() === currentMonth);
    const lastMonthSales = sales.filter(s => new Date(s.createdAt).getMonth() === currentMonth - 1);
    
    const currentRevenue = currentMonthSales.reduce((s, item) => s + (item.total || 0), 0);
    const lastRevenue = lastMonthSales.reduce((s, item) => s + (item.total || 0), 0);
    const salesGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : 0;
    
    return {
      salesGrowth: parseFloat(salesGrowth as string) || 0,
      clientGrowth: 5.2,
      profitGrowth: 8.3,
      avgOrderGrowth: 3.5
    };
  }

  async exportAnalytics(userId: number) {
    return { generatedAt: new Date(), message: "Export analytics" };
  }

  async getPredictions(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const totalSales = sales.reduce((s, item) => s + (item.total || 0), 0);
    const nextMonthSales = totalSales * 1.15;
    const growthRate = 15;
    
    return { nextMonthSales, growthRate, confidence: 85 };
  }

  async getForecast(userId: number, period?: string, scenario?: string) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const totalSales = sales.reduce((s, item) => s + (item.total || 0), 0);
    const forecast: number[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const current = totalSales * (1 + (i * 0.05));
      forecast.push(Math.round(current));
    }
    
    return { forecast, period: period || "month", scenario: scenario || "normal" };
  }
}
