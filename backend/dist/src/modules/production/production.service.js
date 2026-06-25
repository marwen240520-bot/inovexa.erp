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
exports.ProductionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const production_order_entity_1 = require("./entities/production-order.entity");
let ProductionService = class ProductionService {
    constructor(productionRepository) {
        this.productionRepository = productionRepository;
    }
    async findAll(userId) {
        return this.productionRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const order = await this.productionRepository.findOne({ where: { id, userId } });
        if (!order)
            throw new common_1.NotFoundException('Ordre de fabrication non trouvé');
        return order;
    }
    async create(userId, data) {
        const count = await this.productionRepository.count({ where: { userId } });
        const orderNumber = `PO-${(count + 1).toString().padStart(4, '0')}`;
        const order = this.productionRepository.create({
            ...data,
            userId,
            orderNumber,
            progress: 0,
            completedQuantity: 0
        });
        return this.productionRepository.save(order);
    }
    async update(id, userId, data) {
        const order = await this.findOne(id, userId);
        Object.assign(order, data);
        return this.productionRepository.save(order);
    }
    async updateStatus(id, userId, status) {
        const order = await this.findOne(id, userId);
        order.status = status;
        if (status === 'completed') {
            order.progress = 100;
            order.completedQuantity = order.quantity;
            order.endDate = new Date();
        }
        return this.productionRepository.save(order);
    }
    async updateProgress(id, userId, progress) {
        const order = await this.findOne(id, userId);
        order.progress = progress;
        order.completedQuantity = Math.floor((progress / 100) * order.quantity);
        if (progress >= 100) {
            order.status = 'completed';
            order.endDate = new Date();
        }
        else if (progress > 0 && order.status === 'pending') {
            order.status = 'in_progress';
        }
        return this.productionRepository.save(order);
    }
    async delete(id, userId) {
        const order = await this.findOne(id, userId);
        await this.productionRepository.delete(id);
        return { success: true };
    }
};
exports.ProductionService = ProductionService;
exports.ProductionService = ProductionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(production_order_entity_1.ProductionOrder)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductionService);
//# sourceMappingURL=production.service.js.map