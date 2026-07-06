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
const supplier_entity_1 = require("../suppliers/supplier.entity");
let PurchasesService = class PurchasesService {
    constructor(purchaseRepository, productRepository, supplierRepository) {
        this.purchaseRepository = purchaseRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }
    async ensureSupplierExists(userId, supplierName) {
        const name = (supplierName || '').trim();
        if (!name)
            return null;
        const existing = await this.supplierRepository
            .createQueryBuilder('s')
            .where('s.userId = :userId', { userId })
            .andWhere('LOWER(s.name) = LOWER(:name)', { name })
            .getOne();
        if (existing)
            return existing;
        const supplier = this.supplierRepository.create({ userId, name, email: '' });
        return this.supplierRepository.save(supplier);
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
        return this.purchaseRepository.find({
            where,
            relations: ['product'],
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, userId) {
        const purchase = await this.purchaseRepository.findOne({ where: { id, userId }, relations: ['product'] });
        if (!purchase)
            throw new common_1.NotFoundException('Achat non trouve');
        return purchase;
    }
    async create(userId, data) {
        if (!data.productId) {
            throw new common_1.BadRequestException('Le produit est requis');
        }
        const product = await this.productRepository.findOne({ where: { id: data.productId } });
        if (!product) {
            throw new common_1.NotFoundException('Produit non trouve');
        }
        const supplier = await this.ensureSupplierExists(userId, data.supplierName);
        const purchase = this.purchaseRepository.create({
            ...data,
            supplierName: supplier ? supplier.name : (data.supplierName || null),
            userId,
            productName: product.name,
            total: (data.unitPrice || 0) * (data.quantity || 1)
        });
        const savedPurchase = await this.purchaseRepository.save(purchase);
        product.quantity = (product.quantity || 0) + (data.quantity || 0);
        await this.productRepository.save(product);
        return {
            ...savedPurchase,
            newStock: product.quantity
        };
    }
    async updateStatus(id, userId, status) {
        const purchase = await this.purchaseRepository.findOne({ where: { id, userId } });
        if (!purchase)
            throw new common_1.NotFoundException('Achat non trouve');
        purchase.status = status;
        return this.purchaseRepository.save(purchase);
    }
    async delete(id, userId) {
        const purchase = await this.findOne(id, userId);
        const product = await this.productRepository.findOne({ where: { id: purchase.productId } });
        if (product) {
            product.quantity = Math.max(0, (product.quantity || 0) - (purchase.quantity || 0));
            await this.productRepository.save(product);
        }
        await this.purchaseRepository.delete(id);
        return { success: true, message: 'Achat supprimé, stock rétabli' };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map