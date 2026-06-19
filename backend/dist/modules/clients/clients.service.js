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
let ClientsService = class ClientsService {
    constructor(clientRepository) {
        this.clientRepository = clientRepository;
    }
    async findAll(userId) {
        return this.clientRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
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
    async importClients(userId, clients) {
        let success = 0;
        let errors = 0;
        for (const client of clients) {
            try {
                const newClient = this.clientRepository.create({ ...client, userId });
                await this.clientRepository.save(newClient);
                success++;
            }
            catch (e) {
                errors++;
            }
        }
        return { success, errors, total: clients.length };
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