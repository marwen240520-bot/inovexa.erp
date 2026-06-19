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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./entities/category.entity");
let CategoriesService = class CategoriesService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async findAll(userId) {
        return this.categoryRepository.find({ where: { userId } });
    }
    async findOne(id, userId) {
        const category = await this.categoryRepository.findOne({ where: { id, userId } });
        if (!category)
            throw new common_1.NotFoundException('Catégorie non trouvée');
        return category;
    }
    async findByName(name, userId) {
        if (!name)
            return null;
        return this.categoryRepository.findOne({ where: { name, userId } });
    }
    async create(userId, data) {
        if (!data.name) {
            throw new common_1.ConflictException('Le nom de la catégorie est requis');
        }
        const existing = await this.findByName(data.name, userId);
        if (existing) {
            throw new common_1.ConflictException('Une catégorie avec ce nom existe déjà');
        }
        const category = this.categoryRepository.create({ ...data, userId });
        return this.categoryRepository.save(category);
    }
    async update(id, userId, data) {
        const category = await this.findOne(id, userId);
        if (data.name && data.name !== category.name) {
            const existing = await this.findByName(data.name, userId);
            if (existing) {
                throw new common_1.ConflictException('Une catégorie avec ce nom existe déjà');
            }
        }
        Object.assign(category, data);
        return this.categoryRepository.save(category);
    }
    async delete(id, userId) {
        const category = await this.findOne(id, userId);
        await this.categoryRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const categories = await this.findAll(userId);
        return {
            total: categories.length,
            items: categories
        };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map