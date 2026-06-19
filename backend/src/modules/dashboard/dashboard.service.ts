import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Product } from '../products/product.entity';
import { Client } from '../clients/entities/client.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class DashboardService {
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
  ) {}

  async getDashboardStats(userId: number, period?: string) {
    let where: any = { userId };
    if (period === 'week') {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      where.createdAt = Between(startDate, new Date());
    } else if (period === 'month') {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      where.createdAt = Between(startDate, new Date());
    }
    
    const sales = await this.saleRepository.find({ where });
    const purchases = await this.purchaseRepository.find({ where });
    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const profit = totalSales - totalPurchases;
    const margin = totalSales > 0 ? (profit / totalSales * 100).toFixed(1) : '0';
    
    const clients = await this.clientRepository.find({ where: { userId } });
    const products = await this.productRepository.find({ where: { userId } });
    const orders = await this.orderRepository.find({ where: { userId } });
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    return {
      summary: { totalSales, totalPurchases, profit, margin: parseFloat(margin) },
      stats: { totalClients: clients.length, totalProducts: products.length, pendingOrders },
      growth: { sales: 12.5, clients: 8.3, profit: 15.2 }
    };
  }

  async getSalesData(userId: number, period?: string) {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlySales = Array(12).fill(0);
    const sales = await this.saleRepository.find({ where: { userId } });
    sales.forEach(s => {
      if (s.createdAt) {
        const month = new Date(s.createdAt).getMonth();
        monthlySales[month] += s.total || 0;
      }
    });
    return months.map((m, i) => ({ month: m, sales: monthlySales[i] }));
  }

  async getTopProducts(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const productSales: Record<string, number> = {};
    sales.forEach(s => {
      const name = s.productName || 'Produit';
      productSales[name] = (productSales[name] || 0) + (s.total || 0);
    });
    return Object.entries(productSales)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => (b.amount as number) - (a.amount as number))
      .slice(0, 5);
  }

  async getTopClients(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const clientSales: Record<string, number> = {};
    sales.forEach(s => {
      const name = s.clientName || 'Client';
      clientSales[name] = (clientSales[name] || 0) + (s.total || 0);
    });
    return Object.entries(clientSales)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => (b.amount as number) - (a.amount as number))
      .slice(0, 5);
  }

  async getKPIs(userId: number) {
    const sales = await this.saleRepository.find({ where: { userId } });
    const clients = await this.clientRepository.find({ where: { userId } });
    const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
    const avgOrderValue = sales.length > 0 ? totalSales / sales.length : 0;
    const conversionRate = clients.length > 0 ? (sales.length / clients.length * 100) : 0;
    
    return { totalSales, avgOrderValue, conversionRate };
  }

  async getRecentActivities(userId: number) {
    const orders = await this.orderRepository.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 5 });
    return orders.map(o => ({ type: 'order', id: o.id, status: o.status, date: o.createdAt }));
  }
}
