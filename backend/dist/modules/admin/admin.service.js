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
    sanitizeDate(date) {
        if (!date)
            return null;
        try {
            const d = new Date(date);
            if (isNaN(d.getTime()))
                return null;
            return d.toISOString();
        }
        catch {
            return null;
        }
    }
    async getAllClients() {
        return this.userRepository.find({
            where: { role: 'client' },
            select: ['id', 'email', 'name', 'companyName', 'phone', 'subscriptionStart', 'subscriptionEnd', 'isActive', 'createdAt']
        });
    }
    async getClientById(id) {
        const client = await this.userRepository.findOne({
            where: { id: id, role: 'client' }
        });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        return client;
    }
    async createClient(body) {
        const existingUser = await this.userRepository.findOne({
            where: { email: body.email }
        });
        if (existingUser) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const now = new Date();
        const subscriptionEnd = new Date();
        const duration = Math.max(1, body.subscriptionDuration || 30);
        subscriptionEnd.setDate(now.getDate() + duration);
        const newClient = this.userRepository.create({
            email: body.email,
            password: hashedPassword,
            name: body.name,
            companyName: body.companyName,
            phone: body.phone || '',
            role: 'client',
            subscriptionStart: now.toISOString(),
            subscriptionEnd: subscriptionEnd.toISOString(),
            isActive: true
        });
        await this.userRepository.save(newClient);
        return {
            success: true,
            message: 'Client créé avec succès',
            client: {
                id: newClient.id,
                email: newClient.email,
                name: newClient.name,
                companyName: newClient.companyName,
                subscriptionEnd: newClient.subscriptionEnd
            }
        };
    }
    async updateClient(id, body) {
        const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        if (body.email && body.email !== client.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: body.email }
            });
            if (existingUser) {
                throw new common_1.ConflictException('Cet email est déjà utilisé par un autre compte');
            }
        }
        if (body.name)
            client.name = body.name;
        if (body.companyName)
            client.companyName = body.companyName;
        if (body.phone)
            client.phone = body.phone;
        if (body.email)
            client.email = body.email;
        if (body.subscriptionEnd) {
            const sanitizedDate = this.sanitizeDate(body.subscriptionEnd);
            client.subscriptionEnd = sanitizedDate;
        }
        await this.userRepository.save(client);
        return { success: true, message: 'Client mis à jour' };
    }
    async updateClientModules(id, modules) {
        const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        client.modules = JSON.stringify(modules);
        await this.userRepository.save(client);
        return { success: true, message: 'Modules mis à jour' };
    }
    async extendSubscription(id, days) {
        const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        let currentDate = client.subscriptionEnd ? new Date(client.subscriptionEnd) : new Date();
        const daysToAdd = Math.max(1, days || 30);
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        client.subscriptionEnd = currentDate.toISOString();
        await this.userRepository.save(client);
        return { success: true, message: `Abonnement prolongé de ${daysToAdd} jours`, newEnd: client.subscriptionEnd };
    }
    async deleteClient(id) {
        const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
        if (!client)
            throw new common_1.NotFoundException('Client non trouvé');
        await this.userRepository.delete(id);
        return { success: true, message: 'Client supprimé' };
    }
    async toggleClientStatus(id) {
        const client = await this.userRepository.findOne({ where: { id: id, role: 'client' } });
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