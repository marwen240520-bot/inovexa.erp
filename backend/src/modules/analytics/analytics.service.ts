import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  async getDashboardData() {
    return {
      totalRevenue: 125000,
      totalUsers: 150,
      totalOrders: 450,
      conversionRate: 3.2,
    };
  }

  async getFinancialMetrics() {
    return {
      revenue: 125000,
      expenses: 45000,
      profit: 80000,
      pendingInvoices: 12,
    };
  }

  async getInventoryMetrics() {
    return {
      totalProducts: 1250,
      lowStock: 8,
      outOfStock: 3,
      totalValue: 75000,
    };
  }

  async getHrMetrics() {
    return {
      totalEmployees: 45,
      activeEmployees: 42,
      onLeave: 3,
      averageSalary: 38000,
    };
  }

  async getSalesMetrics() {
    return {
      today: 2500,
      thisWeek: 18500,
      thisMonth: 78500,
      topProduct: 'Laptop Pro',
    };
  }
}
