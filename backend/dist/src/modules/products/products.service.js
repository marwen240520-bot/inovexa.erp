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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const import_utils_1 = require("../../common/import-utils");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async findAll(userId) {
        return this.productRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const product = await this.productRepository.findOne({
            where: { id, userId },
        });
        if (!product)
            throw new common_1.NotFoundException('Produit non trouvé');
        return product;
    }
    async create(userId, data) {
        const productData = {
            name: data.name,
            sku: data.sku || '',
            price: this.parseNumber(data.price),
            quantity: this.parseNumber(data.quantity),
            categoryId: this.parseCategoryId(data.categoryId),
            imageUrl: this.cleanImage(data.imageUrl),
            userId: userId,
        };
        const product = this.productRepository.create(productData);
        return this.productRepository.save(product);
    }
    async importProducts(userId, products) {
        if (!Array.isArray(products) || products.length === 0) {
            throw new common_1.BadRequestException('Aucun produit à importer');
        }
        console.log('[ProductsService] Premier produit reçu:', JSON.stringify(products[0]));
        let success = 0;
        let errors = 0;
        const errorDetails = [];
        for (let i = 0; i < products.length; i++) {
            const data = products[i];
            try {
                if (!data || typeof data !== 'object') {
                    throw new Error('Ligne invalide');
                }
                const name = this.findField(data, ['name', 'Name', 'NAME', 'nom', 'Nom', 'NOM', 'libelle', 'libellé']);
                if (!name || String(name).trim() === '') {
                    throw new Error(`Nom du produit manquant (clés reçues: ${Object.keys(data).join(', ')})`);
                }
                const sku = this.findField(data, ['sku', 'SKU', 'Sku', 'reference', 'référence', 'ref']);
                const price = this.findField(data, ['price', 'Price', 'PRICE', 'prix', 'Prix', 'PRIX']);
                const quantity = this.findField(data, ['quantity', 'Quantity', 'QUANTITY', 'quantite', 'quantité', 'stock', 'qty']);
                const categoryId = this.findField(data, ['categoryId', 'category_id', 'categorieId', 'categorie_id']);
                const image = this.findField(data, ['imageUrl', 'image_url', 'image', 'photo', 'picture', 'url image', 'lien image', 'image url']);
                const productData = {
                    name: String(name).trim(),
                    sku: sku ? String(sku).trim() : '',
                    price: this.parseNumber(price),
                    quantity: this.parseNumber(quantity),
                    categoryId: this.parseCategoryId(categoryId),
                    imageUrl: this.cleanImage(image),
                    userId: userId,
                };
                const product = this.productRepository.create(productData);
                await this.productRepository.save(product);
                success++;
            }
            catch (error) {
                errors++;
                errorDetails.push({
                    row: i + 2,
                    name: data?.name || data?.Name || data?.nom || '',
                    sku: data?.sku || data?.SKU || '',
                    error: error instanceof Error ? error.message : 'Erreur inconnue',
                });
            }
        }
        return {
            success,
            errors,
            total: products.length,
            errorDetails: errorDetails.slice(0, 10),
            message: `${success} produit(s) importé(s), ${errors} erreur(s)`,
        };
    }
    async update(id, userId, data) {
        const product = await this.findOne(id, userId);
        const { quantity, id: _id, userId: _userId, user: _user, category: _category, createdAt: _c, updatedAt: _u, ...updateData } = data || {};
        if ('imageUrl' in updateData)
            updateData.imageUrl = this.cleanImage(updateData.imageUrl);
        Object.assign(product, updateData);
        return this.productRepository.save(product);
    }
    async delete(id, userId) {
        await this.findOne(id, userId);
        await this.productRepository.delete(id);
        return { success: true };
    }
    findField(data, candidates) {
        if (!data || typeof data !== 'object')
            return undefined;
        for (const c of candidates) {
            if (data[c] !== undefined)
                return data[c];
        }
        const lowerCandidates = candidates.map(c => c.toLowerCase());
        for (const key of Object.keys(data)) {
            if (lowerCandidates.includes(key.toLowerCase())) {
                return data[key];
            }
        }
        return undefined;
    }
    cleanImage(value) {
        if (value === null || value === undefined)
            return null;
        const v = String(value).trim();
        if (v === '' || v === 'null' || v === 'undefined')
            return null;
        if (v.length > ProductsService_1.MAX_IMAGE_LENGTH) {
            throw new common_1.BadRequestException('Image trop volumineuse (réduisez-la avant l\'envoi)');
        }
        if (/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(v))
            return v;
        if (/^https?:\/\/[^\s<>"']+$/i.test(v))
            return v;
        throw new common_1.BadRequestException('Format d\'image non pris en charge (utilisez PNG, JPEG, WebP ou GIF)');
    }
    parseNumber(value) {
        return (0, import_utils_1.toNumber)(value, 0);
    }
    parseCategoryId(value) {
        if (value === null || value === undefined || value === '' ||
            value === 'null' || value === 'undefined') {
            return null;
        }
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
};
exports.ProductsService = ProductsService;
ProductsService.MAX_IMAGE_LENGTH = 1_900_000;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map