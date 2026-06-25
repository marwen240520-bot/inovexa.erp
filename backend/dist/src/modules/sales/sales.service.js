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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("./entities/sale.entity");
const product_entity_1 = require("../products/product.entity");
let SalesService = class SalesService {
    constructor(saleRepository, productRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
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
        return this.saleRepository.find({
            where,
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const sale = await this.saleRepository.findOne({ where: { id, userId } });
        if (!sale)
            throw new common_1.NotFoundException('Vente non trouvée');
        return sale;
    }
    async create(userId, data) {
        const product = await this.productRepository.findOne({
            where: { id: data.productId, userId }
        });
        if (!product) {
            throw new common_1.NotFoundException('Produit non trouvé');
        }
        if ((product.quantity || 0) < (data.quantity || 0)) {
            throw new common_1.BadRequestException(`Stock insuffisant pour ${product.name}. Disponible: ${product.quantity || 0}, Demandé: ${data.quantity}`);
        }
        product.quantity = (product.quantity || 0) - (data.quantity || 0);
        await this.productRepository.save(product);
        const sale = this.saleRepository.create({
            ...data,
            userId,
            total: (data.unitPrice || 0) * (data.quantity || 1)
        });
        const savedSale = await this.saleRepository.save(sale);
        return {
            ...savedSale,
            newStock: product.quantity
        };
    }
    async updateStatus(id, userId, status) {
        const sale = await this.findOne(id, userId);
        sale.status = status;
        return this.saleRepository.save(sale);
    }
    async delete(id, userId) {
        const sale = await this.findOne(id, userId);
        const product = await this.productRepository.findOne({
            where: { id: sale.productId, userId }
        });
        if (product) {
            product.quantity = (product.quantity || 0) + (sale.quantity || 0);
            await this.productRepository.save(product);
        }
        await this.saleRepository.delete(id);
        return { success: true, message: 'Vente supprimée, stock rétabli' };
    }
    async getStats(userId) {
        const sales = await this.findAll(userId);
        const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const paid = sales.filter(s => s.status === 'paid').length;
        const pending = sales.filter(s => s.status === 'pending').length;
        const cancelled = sales.filter(s => s.status === 'cancelled').length;
        return {
            total: sales.length,
            totalAmount: total,
            averageAmount: sales.length > 0 ? total / sales.length : 0,
            paid,
            pending,
            cancelled
        };
    }
    async importSales(userId, salesData) {
        let success = 0;
        let errors = 0;
        for (const data of salesData) {
            try {
                const product = await this.productRepository.findOne({
                    where: { id: data.productId, userId }
                });
                if (!product) {
                    errors++;
                    continue;
                }
                if ((product.quantity || 0) < (data.quantity || 0)) {
                    errors++;
                    continue;
                }
                product.quantity = (product.quantity || 0) - (data.quantity || 0);
                await this.productRepository.save(product);
                const sale = this.saleRepository.create({
                    ...data,
                    userId,
                    total: (data.unitPrice || 0) * (data.quantity || 1)
                });
                await this.saleRepository.save(sale);
                success++;
            }
            catch (e) {
                errors++;
            }
        }
        return { success, errors };
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SalesService);
//# sourceMappingURL=sales.service.js.map