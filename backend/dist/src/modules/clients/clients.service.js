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
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_entity_1 = require("./entities/client.entity");
const import_utils_1 = require("../../common/import-utils");
let ClientsService = class ClientsService {
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }
    async getSalesTotalsByClientName(userId) {
        const map = new Map();
        try {
            const rows = await this.clientRepository.manager.query(`SELECT LOWER("clientName") AS name, COALESCE(SUM(total), 0) AS total
           FROM sales
           WHERE "userId" = $1 AND "clientName" IS NOT NULL AND status != 'cancelled'
           GROUP BY LOWER("clientName")`, [userId]);
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
        const clients = await this.clientRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
        const totals = await this.getSalesTotalsByClientName(userId);
        return clients.map(c => ({
            ...c,
            totalSpent: totals.get((c.name || '').toLowerCase()) ?? 0,
        }));
    }
    async findOne(id, userId) {
        const client = await this.clientRepository.findOne({ where: { id, userId } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client;
    }
    async create(userId, data) {
        const client = this.clientRepository.create({ ...data, userId });
        return this.clientRepository.save(client);
    }
    async update(id, userId, data) {
        const client = await this.findOne(id, userId);
        Object.assign(client, data);
        return this.clientRepository.save(client);
    }
    async updateStatus(id, userId, status) {
        const client = await this.findOne(id, userId);
        client.status = status;
        return this.clientRepository.save(client);
    }
    async importClients(userId, rows) {
        if (!Array.isArray(rows) || rows.length === 0)
            throw new common_1.BadRequestException('Aucun client à importer');
        const details = [];
        let success = 0;
        let processed = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if ((0, import_utils_1.isEmptyRow)(row))
                continue;
            processed++;
            try {
                const name = (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['name', 'nom', 'client', 'nom client', 'raison sociale', 'societe', 'entreprise', 'company', 'full name']));
                if (!name)
                    throw new Error(`Nom du client manquant (colonnes reçues : ${Object.keys(row).join(', ')})`);
                const entity = this.clientRepository.create({
                    userId,
                    name,
                    email: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['email', 'e-mail', 'mail', 'courriel', 'adresse email'])) || '',
                    phone: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['phone', 'telephone', 'tel', 'mobile', 'gsm', 'portable'])) || undefined,
                    address: (0, import_utils_1.toText)((0, import_utils_1.pick)(row, ['address', 'adresse', 'ville'])) || undefined,
                    totalSpent: (0, import_utils_1.toNumber)((0, import_utils_1.pick)(row, ['totalSpent', 'total spent', 'total depense', 'montant total', 'total'])),
                    status: (0, import_utils_1.normalizeStatus)((0, import_utils_1.pick)(row, ['status', 'statut', 'etat']), import_utils_1.ACTIVE_STATUS, 'active'),
                });
                await this.clientRepository.save(entity);
                success++;
            }
            catch (e) {
                details.push({ row: i + 2, error: (0, import_utils_1.errorMessage)(e) });
            }
        }
        return (0, import_utils_1.buildImportResult)('client(s)', processed, success, details);
    }
    async delete(id, userId) {
        const client = await this.findOne(id, userId);
        await this.clientRepository.delete(id);
        return { success: true };
    }
    async getStats(userId) {
        const clients = await this.findAll(userId);
        const total = clients.length;
        const active = clients.filter(c => c.status === 'active').length;
        const inactive = clients.filter(c => c.status === 'inactive').length;
        const totalSpent = clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
        return { total, active, inactive, totalSpent };
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientsService);
//# sourceMappingURL=clients.service.js.map