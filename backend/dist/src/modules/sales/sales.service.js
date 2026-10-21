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
const client_entity_1 = require("../clients/entities/client.entity");
const import_utils_1 = require("../../common/import-utils");
let SalesService = class SalesService {
    constructor(saleRepository, productRepository, clientRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
    }
    async ensureClientExists(userId, clientName) {
        const name = (clientName || '').trim();
        if (!name)
            return null;
        const existing = await this.clientRepository
            .createQueryBuilder('c')
            .where('c.userId = :userId', { userId })
            .andWhere('LOWER(c.name) = LOWER(:name)', { name })
            .getOne();
        if (existing)
            return existing;
        const client = this.clientRepository.create({ userId, name, email: '' });
        return this.clientRepository.save(client);
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
        const client = await this.ensureClientExists(userId, data.clientName);
        const sale = this.saleRepository.create({
            ...data,
            clientName: client ? client.name : (data.clientName || null),
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
    async importSales(userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0)
            throw new common_1.BadRequestException('Aucune vente à importer');
        const details = [];
        let success = 0;
        let processed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if ((0, import_utils_1.isEmptyRow)(row))
                continue;
            processed++;
            try {
                const quantity = (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['quantity', 'quantite', 'qty', 'qte']), 1);
                if (quantity <= 0)
                    throw new Error('Quantité invalide (doit être supérieure à 0)');
                const productId = (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['productId', 'product id', 'id produit', 'produit id']), 0);
                const sku = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['sku', 'reference', 'ref', 'code']));
                const productName = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['productName', 'product name', 'product', 'produit', 'nom produit', 'article', 'designation', 'libelle']));
                let product = null;
                if (productId)
                    product = await this.productRepository.findOne({ where: { id: productId, userId } });
                if (!product && sku)
                    product = await this.productRepository.findOne({ where: { sku, userId } });
                if (!product && productName) {
                    product = await this.productRepository
                        .createQueryBuilder('p')
                        .where('p.userId = :userId', { userId })
                        .andWhere('LOWER(p.name) = LOWER(:name)', { name: productName })
                        .getOne();
                }
                if (!product) {
                    throw new Error(`Produit introuvable (${productName || sku || productId || 'non renseigné'}). Importez ou créez d'abord vos produits.`);
                }
                if ((product.quantity || 0) < quantity) {
                    throw new Error(`Stock insuffisant pour « ${product.name} » (disponible : ${product.quantity || 0}, demandé : ${quantity}). Enregistrez d'abord vos achats.`);
                }
                const unitPrice = (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['unitPrice', 'unit price', 'prix unitaire', 'pu', 'prix', 'price']), Number(product.price) || 0);
                const clientName = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['clientName', 'client name', 'client', 'nom client', 'customer']));
                const client = await this.ensureClientExists(userId, clientName || undefined);
                const date = (0, import_utils_1.toDate)((0, import_utils_1.pick)(row, ['createdAt', 'date', 'date vente', 'sale date']));
                const sale = this.saleRepository.create({
                    userId,
                    productId: product.id,
                    productName: product.name,
                    clientName: client ? client.name : clientName || undefined,
                    quantity,
                    unitPrice,
                    total: Math.round(unitPrice * quantity * 100) / 100,
                    status: (0, import_utils_1.normalizeStatus)((0, import_utils_1.pick)(row, ['status', 'statut', 'etat']), { completed: ['terminee', 'terminé', 'payee', 'payée', 'livree', 'livrée', 'completed', 'paid', 'delivered'], pending: ['en attente', 'pending'], cancelled: ['annulee', 'annulée', 'cancelled', 'canceled'] }, 'pending'),
                    ...(date ? { createdAt: date } : {}),
                });
                await this.saleRepository.save(sale);
                product.quantity = (product.quantity || 0) - quantity;
                await this.productRepository.save(product);
                success++;
            }
            catch (e) {
                details.push({ row: i + 2, error: (0, import_utils_1.errorMessage)(e) });
            }
        }
        return (0, import_utils_1.buildImportResult)('vente(s)', processed, success, details);
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SalesService);
//# sourceMappingURL=sales.service.js.map