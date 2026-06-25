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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sale_entity_1 = require("../sales/entities/sale.entity");
const product_entity_1 = require("../products/product.entity");
const client_entity_1 = require("../clients/entities/client.entity");
const employee_entity_1 = require("../employees/entities/employee.entity");
let ReportsService = class ReportsService {
    constructor(saleRepository, productRepository, clientRepository, employeeRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.clientRepository = clientRepository;
        this.employeeRepository = employeeRepository;
        this.savedReports = [];
    }
    async getSalesReport(userId, start, end) {
        const sales = await this.saleRepository.find({ where: { userId } });
        const total = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        return { type: "sales", generatedAt: new Date(), total, count: sales.length, items: sales };
    }
    async getInventoryReport(userId) {
        const products = await this.productRepository.find({ where: { userId } });
        const totalValue = products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0);
        return { type: "inventory", generatedAt: new Date(), totalProducts: products.length, totalValue, items: products };
    }
    async getClientsReport(userId) {
        const clients = await this.clientRepository.find({ where: { userId } });
        return { type: "clients", generatedAt: new Date(), total: clients.length, items: clients };
    }
    async getEmployeesReport(userId) {
        const employees = await this.employeeRepository.find({ where: { userId } });
        const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
        return { type: "employees", generatedAt: new Date(), total: employees.length, totalSalary, items: employees };
    }
    async getLogisticsReport(userId) {
        return { type: "logistics", generatedAt: new Date(), total: 0, items: [] };
    }
    async getSavedReports(userId) {
        return this.savedReports.filter(r => r.userId === userId);
    }
    async saveReport(userId, name, type, data) {
        const report = {
            id: Date.now(),
            userId,
            name,
            type,
            data,
            createdAt: new Date()
        };
        this.savedReports.push(report);
        return { success: true, message: 'Rapport sauvegardé', report };
    }
    async deleteSavedReport(id, userId) {
        const index = this.savedReports.findIndex(r => r.id === id && r.userId === userId);
        if (index !== -1) {
            this.savedReports.splice(index, 1);
            return { success: true, message: 'Rapport supprimé' };
        }
        return { success: false, message: 'Rapport non trouvé' };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sale_entity_1.Sale)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(2, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __param(3, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map