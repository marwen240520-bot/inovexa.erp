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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
let OrdersService = class OrdersService {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async findAll(userId, period) {
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
        else if (period === 'year') {
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            where.createdAt = (0, typeorm_2.Between)(startDate, new Date());
        }
        return this.orderRepository.find({
            where,
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const order = await this.orderRepository.findOne({ where: { id, userId } });
        if (!order)
            throw new common_1.NotFoundException('Commande non trouvée');
        return order;
    }
    async create(userId, data) {
        const order = this.orderRepository.create({
            ...data,
            userId,
            total: (data.unitPrice || 0) * (data.quantity || 1)
        });
        return this.orderRepository.save(order);
    }
    async update(id, userId, data) {
        const order = await this.findOne(id, userId);
        Object.assign(order, data);
        if (data.unitPrice !== undefined || data.quantity !== undefined) {
            order.total = (order.unitPrice || 0) * (order.quantity || 1);
        }
        return this.orderRepository.save(order);
    }
    async updateStatus(id, userId, status) {
        const order = await this.findOne(id, userId);
        order.status = status;
        return this.orderRepository.save(order);
    }
    async delete(id, userId) {
        const order = await this.findOne(id, userId);
        await this.orderRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const orders = await this.findAll(userId);
        const total = orders.length;
        const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;
        const processing = orders.filter(o => o.status === 'processing').length;
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        return { total, pending, processing, delivered, cancelled, totalAmount };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map