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
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_entity_1 = require("./entities/purchase.entity");
const product_entity_1 = require("../products/product.entity");
let PurchasesService = class PurchasesService {
    constructor(purchaseRepository, productRepository) {
        this.purchaseRepository = purchaseRepository;
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
        else if (period === 'year') {
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            where.createdAt = (0, typeorm_2.Between)(startDate, new Date());
        }
        return this.purchaseRepository.find({
            where,
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
        if (!purchase)
            throw new common_1.NotFoundException('Achat non trouvé');
        return purchase;
    }
    async create(userId, data) {
        const product = await this.productRepository.findOne({
            where: { id: data.productId, userId }
        });
        if (!product) {
            throw new common_1.NotFoundException('Produit non trouvé');
        }
        product.quantity = (product.quantity || 0) + (data.quantity || 0);
        await this.productRepository.save(product);
        const purchase = this.purchaseRepository.create({
            ...data,
            userId,
            total: (data.unitPrice || 0) * (data.quantity || 1)
        });
        const savedPurchase = await this.purchaseRepository.save(purchase);
        return {
            ...savedPurchase,
            newStock: product.quantity
        };
    }
    async updateStatus(id, userId, status) {
        const purchase = await this.findOne(id, userId);
        purchase.status = status;
        return this.purchaseRepository.save(purchase);
    }
    async importPurchases(userId, purchases) {
        let success = 0;
        let errors = 0;
        for (const purchase of purchases) {
            try {
                const product = await this.productRepository.findOne({
                    where: { id: purchase.productId, userId }
                });
                if (!product) {
                    errors++;
                    continue;
                }
                product.quantity = (product.quantity || 0) + (purchase.quantity || 0);
                await this.productRepository.save(product);
                const newPurchase = this.purchaseRepository.create({
                    ...purchase,
                    userId,
                    total: (purchase.unitPrice || 0) * (purchase.quantity || 1)
                });
                await this.purchaseRepository.save(newPurchase);
                success++;
            }
            catch (e) {
                errors++;
            }
        }
        return { success, errors, total: purchases.length };
    }
    async delete(id, userId) {
        const purchase = await this.findOne(id, userId);
        const product = await this.productRepository.findOne({
            where: { id: purchase.productId, userId }
        });
        if (product) {
            product.quantity = (product.quantity || 0) - (purchase.quantity || 0);
            await this.productRepository.save(product);
        }
        await this.purchaseRepository.delete(id);
        return { success: true, message: 'Achat supprimé, stock diminué' };
    }
    async getStats(userId) {
        const purchases = await this.findAll(userId);
        const total = purchases.length;
        const totalAmount = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
        const average = total > 0 ? totalAmount / total : 0;
        const pending = purchases.filter(p => p.status === 'pending').length;
        const delivered = purchases.filter(p => p.status === 'delivered').length;
        return { total, amount: totalAmount, average, pending, delivered };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map