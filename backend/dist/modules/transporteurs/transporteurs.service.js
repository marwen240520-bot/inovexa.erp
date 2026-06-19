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
exports.TransporteursService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const transporteur_entity_1 = require("./entities/transporteur.entity");
const user_entity_1 = require("../users/entities/user.entity");
let TransporteursService = class TransporteursService {
    constructor(transporteurRepository, userRepository) {
        this.transporteurRepository = transporteurRepository;
        this.userRepository = userRepository;
    }
    async findAll(clientId) {
        return this.transporteurRepository.find({
            where: { clientId },
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, clientId) {
        const transporteur = await this.transporteurRepository.findOne({ where: { id, clientId } });
        if (!transporteur)
            throw new common_1.NotFoundException('Transporteur non trouvé');
        return transporteur;
    }
    async create(clientId, data) {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.userRepository.create({
            email: data.email,
            password: hashedPassword,
            name: data.name,
            companyName: data.companyName || '',
            phone: data.phone || '',
            role: 'transporteur',
            isActive: true
        });
        await this.userRepository.save(user);
        const transporteur = this.transporteurRepository.create({
            clientId,
            userId: user.id,
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            companyName: data.companyName || '',
            address: data.address || '',
            isActive: true
        });
        return this.transporteurRepository.save(transporteur);
    }
    async update(id, clientId, data) {
        const transporteur = await this.findOne(id, clientId);
        if (!transporteur)
            throw new common_1.NotFoundException('Transporteur non trouvé');
        if (transporteur.userId) {
            const updateData = {
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                companyName: data.companyName || ''
            };
            if (data.password && data.password.trim() !== '') {
                updateData.password = await bcrypt.hash(data.password, 10);
            }
            await this.userRepository.update(transporteur.userId, updateData);
        }
        Object.assign(transporteur, {
            name: data.name,
            email: data.email,
            phone: data.phone || '',
            companyName: data.companyName || '',
            address: data.address || '',
            isActive: data.status === 'active'
        });
        return this.transporteurRepository.save(transporteur);
    }
    async delete(id, clientId) {
        const transporteur = await this.findOne(id, clientId);
        if (!transporteur)
            throw new common_1.NotFoundException('Transporteur non trouvé');
        if (transporteur.userId) {
            await this.userRepository.delete(transporteur.userId);
        }
        await this.transporteurRepository.delete(id);
        return { success: true };
    }
};
exports.TransporteursService = TransporteursService;
exports.TransporteursService = TransporteursService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transporteur_entity_1.Transporteur)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TransporteursService);
//# sourceMappingURL=transporteurs.service.js.map