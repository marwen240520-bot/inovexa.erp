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
exports.IaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("../sales/entities/sale.entity");
const purchase_entity_1 = require("../purchases/entities/purchase.entity");
const product_entity_1 = require("../products/product.entity");
const client_entity_1 = require("../clients/entities/client.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const ia_chat_entity_1 = require("./entities/ia-chat.entity");
let IaService = class IaService {
    constructor(saleRepository, purchaseRepository, productRepository, clientRepository, orderRepository, invoiceRepository, iaChatRepository) {
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.iaChatRepository = iaChatRepository;
    }
    async getChatHistory(userId) {
        return this.iaChatRepository.find({ where: { userId }, order: { createdAt: 'ASC' }, take: 50 });
    }
    async saveChatMessage(userId, role, content) {
        const message = this.iaChatRepository.create({ userId, role, content });
        return this.iaChatRepository.save(message);
    }
    async getAlerts(userId) {
        const products = await this.productRepository.find({ where: { userId } });
        const orders = await this.orderRepository.find({ where: { userId } });
        const invoices = await this.invoiceRepository.find({ where: { userId } });
        const alerts = [];
        const lowStockCount = products.filter(p => (p.quantity || 0) < 10 && (p.quantity || 0) > 0).length;
        const outOfStockCount = products.filter(p => (p.quantity || 0) === 0).length;
        const pendingOrders = orders.filter(o => o.status === "pending").length;
        const pendingInvoices = invoices.filter(i => i.status === "pending").length;
        if (lowStockCount > 0)
            alerts.push({ type: "warning", message: `${lowStockCount} produit(s) en stock faible` });
        if (outOfStockCount > 0)
            alerts.push({ type: "danger", message: `${outOfStockCount} produit(s) en rupture` });
        if (pendingOrders > 0)
            alerts.push({ type: "info", message: `${pendingOrders} commande(s) en attente` });
        if (pendingInvoices > 0)
            alerts.push({ type: "warning", message: `${pendingInvoices} facture(s) impayées` });
        return alerts;
    }
    async getComparisonStats(userId) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const currentMonth = new Date().getMonth();
        const currentMonthSales = sales.filter(s => new Date(s.createdAt).getMonth() === currentMonth);
        const lastMonthSales = sales.filter(s => new Date(s.createdAt).getMonth() === currentMonth - 1);
        const currentRevenue = currentMonthSales.reduce((s, item) => s + (item.total || 0), 0);
        const lastRevenue = lastMonthSales.reduce((s, item) => s + (item.total || 0), 0);
        const salesGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1) : 0;
        return {
            salesGrowth: parseFloat(salesGrowth) || 0,
            clientGrowth: 5.2,
            profitGrowth: 8.3,
            avgOrderGrowth: 3.5
        };
    }
    async exportAnalytics(userId) {
        return { generatedAt: new Date(), message: "Export analytics" };
    }
    async getPredictions(userId) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const totalSales = sales.reduce((s, item) => s + (item.total || 0), 0);
        const nextMonthSales = totalSales * 1.15;
        const growthRate = 15;
        return { nextMonthSales, growthRate, confidence: 85 };
    }
    async getForecast(userId, period, scenario) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const totalSales = sales.reduce((s, item) => s + (item.total || 0), 0);
        const forecast = [];
        for (let i = 1; i <= 6; i++) {
            const current = totalSales * (1 + (i * 0.05));
            forecast.push(Math.round(current));
        }
        return { forecast, period: period || "month", scenario: scenario || "normal" };
    }
};
exports.IaService = IaService;
exports.IaService = IaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(4, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(5, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(6, (0, typeorm_1.InjectRepository)(ia_chat_entity_1.IaChat)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], IaService);
//# sourceMappingURL=ia.service.js.map