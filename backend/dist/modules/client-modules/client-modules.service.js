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
exports.ClientModulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_modules_entity_1 = require("./entities/client-modules.entity");
let ClientModulesService = class ClientModulesService {
    constructor(clientModulesRepository) {
        this.clientModulesRepository = clientModulesRepository;
    }
    async getModulesByClient(clientId) {
        let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
        if (!modules) {
            modules = await this.createDefaultModules(clientId);
        }
        return modules;
    }
    async createDefaultModules(clientId) {
        const defaultModules = this.clientModulesRepository.create({
            clientId,
            dashboard: true,
            products: true,
            categories: true,
            stock: true,
            sales: true,
            purchases: true,
            orders: true,
            clients: true,
            suppliers: true,
            invoices: true,
            hr: true,
            finance: true,
            logistics: true,
            production: true,
            ai: true,
            reports: true,
            analytics: true,
            profile: true,
            settings: true,
        });
        return this.clientModulesRepository.save(defaultModules);
    }
    async updateModules(clientId, data) {
        let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
        if (!modules) {
            modules = await this.createDefaultModules(clientId);
        }
        const allowedFields = [
            'dashboard', 'products', 'categories', 'stock', 'sales', 'purchases',
            'orders', 'clients', 'suppliers', 'invoices', 'hr', 'finance',
            'logistics', 'production', 'ai', 'reports', 'analytics', 'profile', 'settings'
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                modules[field] = data[field];
            }
        }
        return this.clientModulesRepository.save(modules);
    }
    async getAllModulesConfig() {
        return this.clientModulesRepository.find();
    }
    async getModuleStatus(clientId, moduleName) {
        const modules = await this.getModulesByClient(clientId);
        return modules[moduleName] !== undefined ? modules[moduleName] : true;
    }
    async resetModules(clientId) {
        let modules = await this.clientModulesRepository.findOne({ where: { clientId } });
        if (modules) {
            await this.clientModulesRepository.delete(modules.id);
        }
        return this.createDefaultModules(clientId);
    }
};
exports.ClientModulesService = ClientModulesService;
exports.ClientModulesService = ClientModulesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(client_modules_entity_1.ClientModules)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientModulesService);
//# sourceMappingURL=client-modules.service.js.map