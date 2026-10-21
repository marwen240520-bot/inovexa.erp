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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const supplier_entity_1 = require("./supplier.entity");
const import_utils_1 = require("../../common/import-utils");
let SuppliersService = class SuppliersService {
    constructor(supplierRepository) {
        this.supplierRepository = supplierRepository;
    }
    async getPurchaseTotalsBySupplierName(userId) {
        const map = new Map();
        try {
            const rows = await this.supplierRepository.manager.query(`SELECT LOWER("supplierName") AS name, COALESCE(SUM(total), 0) AS total
           FROM purchases
           WHERE "userId" = $1 AND "supplierName" IS NOT NULL AND status != 'cancelled'
           GROUP BY LOWER("supplierName")`, [userId]);
            for (const row of rows) {
                if (row.name)
                    map.set(row.name, Number(row.total) || 0);
            }
        }
        catch (e) {
        }
        return map;
    }
    async findAll(userId) {
        const suppliers = await this.supplierRepository.find({ where: { userId } });
        const totals = await this.getPurchaseTotalsBySupplierName(userId);
        return suppliers.map(s => ({
            ...s,
            totalPurchases: totals.get((s.name || '').toLowerCase()) ?? 0,
        }));
    }
    async findOne(id, userId) {
        const supplier = await this.supplierRepository.findOne({ where: { id, userId } });
        if (!supplier)
            throw new common_1.NotFoundException('Fournisseur non trouvé');
        return supplier;
    }
    async create(userId, data) {
        const supplier = this.supplierRepository.create({ ...data, userId });
        return this.supplierRepository.save(supplier);
    }
    async update(id, userId, data) {
        const supplier = await this.findOne(id, userId);
        Object.assign(supplier, data);
        return this.supplierRepository.save(supplier);
    }
    async delete(id, userId) {
        const supplier = await this.findOne(id, userId);
        await this.supplierRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const suppliers = await this.findAll(userId);
        const active = suppliers.filter(s => s.status === 'active').length;
        const totalPurchases = suppliers.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
        return { total: suppliers.length, active, totalPurchases };
    }
    async importSuppliers(userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0)
            throw new common_1.BadRequestException('Aucun fournisseur à importer');
        const details = [];
        let success = 0;
        let processed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if ((0, import_utils_1.isEmptyRow)(row))
                continue;
            processed++;
            try {
                const name = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['name', 'nom', 'fournisseur', 'nom fournisseur', 'raison sociale', 'societe', 'entreprise', 'company', 'supplier']));
                if (!name)
                    throw new Error(`Nom du fournisseur manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);
                const entity = this.supplierRepository.create({
                    userId,
                    name,
                    contact: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['contact', 'personne contact', 'interlocuteur', 'responsable'])) || undefined,
                    email: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['email', 'e-mail', 'mail', 'courriel', 'adresse email'])) || '',
                    phone: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm', 'portable'])) || undefined,
                    address: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['address', 'adresse', 'ville'])) || undefined,
                    totalPurchases: (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['totalPurchases', 'total purchases', 'total achats', 'total'])),
                    status: (0, import_utils_1.normalizeStatus)((0, import_utils_1.pick)(row, ['status', 'statut', 'etat']), import_utils_1.ACTIVE_STATUS, 'active'),
                });
                await this.supplierRepository.save(entity);
                success++;
            }
            catch (e) {
                details.push({ row: i + 2, error: (0, import_utils_1.errorMessage)(e) });
            }
        }
        return (0, import_utils_1.buildImportResult)('fournisseur(s)', processed, success, details);
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map