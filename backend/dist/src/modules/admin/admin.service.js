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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
let AdminService = class AdminService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async getAllClients() {
        return this.userRepository.find({
            where: { role: 'client' },
            select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
        });
    }
    async getClientById(id) {
        const client = await this.userRepository.findOne({
            where: { id, role: 'client' },
            select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt', 'modules']
        });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client;
    }
    async getClientModules(id) {
        const client = await this.userRepository.findOne({
            where: { id, role: 'client' },
            select: ['id', 'modules']
        });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client.modules || {};
    }
    async updateClientModules(id, modules) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        client.modules = modules;
        await this.userRepository.save(client);
        return {
            success: true,
            message: 'Modules mis à jour avec succès',
            modules: client.modules
        };
    }
    async createClient(body) {
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const subscriptionEnd = new Date();
        subscriptionEnd.setDate(subscriptionEnd.getDate() + body.subscriptionDuration);
        const client = this.userRepository.create({
            email: body.email,
            password: hashedPassword,
            name: body.name,
            companyName: body.companyName,
            phone: body.phone,
            role: 'client',
            subscriptionStart: new Date(),
            subscriptionEnd,
            isActive: true,
            modules: {}
        });
        await this.userRepository.save(client);
        return {
            success: true,
            message: 'Client créé avec succès',
            client: {
                id: client.id,
                email: client.email,
                name: client.name,
                companyName: client.companyName,
                subscriptionEnd: client.subscriptionEnd,
                modules: client.modules
            }
        };
    }
    async updateClient(id, body) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        delete body.modules;
        delete body.businessCategory;
        Object.assign(client, body);
        await this.userRepository.save(client);
        return { success: true, message: 'Client mis à jour' };
    }
    async extendSubscription(id, days) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        const newEnd = new Date(client.subscriptionEnd);
        newEnd.setDate(newEnd.getDate() + days);
        client.subscriptionEnd = newEnd;
        await this.userRepository.save(client);
        return {
            success: true,
            message: `Abonnement prolongé de ${days} jours`,
            newEnd: newEnd
        };
    }
    async deleteClient(id) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        await this.userRepository.delete(id);
        return { success: true, message: 'Client supprimé' };
    }
    async toggleClientStatus(id) {
        const client = await this.userRepository.findOne({ where: { id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        client.isActive = !client.isActive;
        await this.userRepository.save(client);
        return { success: true, isActive: client.isActive };
    }
    async getAdminStats() {
        const totalClients = await this.userRepository.count({ where: { role: 'client' } });
        const activeClients = await this.userRepository.count({ where: { role: 'client', isActive: true } });
        return { totalClients, activeClients };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map