"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("../sales/entities/sale.entity");
const purchase_entity_1 = require("../purchases/entities/purchase.entity");
const product_entity_1 = require("../products/product.entity");
const client_entity_1 = require("../clients/entities/client.entity");
const order_entity_1 = require("../orders/entities/order.entity");
let DashboardService = class DashboardService {
    constructor(saleRepository, purchaseRepository, productRepository, clientRepository, orderRepository) {
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
        this.orderRepository = orderRepository;
    }
    async getDashboardStats(userId, period) {
        let where = { userId };
        if (period === 'week') {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            where.createdAt = (0, typeorm_2.Between)(startDate, new Date());
        }
        else if (period === 'month') {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            where.createdAt = (0, typeorm_2.Between)(startDate, new Date());
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
    async getSalesData(userId, period) {
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
    async getTopProducts(userId) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const productSales = {};
        sales.forEach(s => {
            const name = s.productName || 'Produit';
            productSales[name] = (productSales[name] || 0) + (s.total || 0);
        });
        return Object.entries(productSales)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }
    async getTopClients(userId) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const clientSales = {};
        sales.forEach(s => {
            const name = s.clientName || 'Client';
            clientSales[name] = (clientSales[name] || 0) + (s.total || 0);
        });
        return Object.entries(clientSales)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }
    async getKPIs(userId) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const clients = await this.clientRepository.find({ where: { userId } });
        const totalSales = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const avgOrderValue = sales.length > 0 ? totalSales / sales.length : 0;
        const conversionRate = clients.length > 0 ? (sales.length / clients.length * 100) : 0;
        return { totalSales, avgOrderValue, conversionRate };
    }
    async getRecentActivities(userId) {
        const orders = await this.orderRepository.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 5 });
        return orders.map(o => ({ type: 'order', id: o.id, status: o.status, date: o.createdAt }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(4, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map