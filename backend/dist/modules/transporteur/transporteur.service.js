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
exports.TransporteurService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipment_entity_1 = require("../logistics/entities/shipment.entity");
const transporteur_entity_1 = require("../transporteurs/entities/transporteur.entity");
let TransporteurService = class TransporteurService {
    constructor(shipmentRepository, transporteurRepository) {
        this.shipmentRepository = shipmentRepository;
        this.transporteurRepository = transporteurRepository;
    }
    async getMyShipments(userId) {
        console.log('=== getMyShipments called ===');
        console.log('userId received:', userId);
        const transporteur = await this.transporteurRepository.findOne({
            where: { userId: userId }
        });
        if (!transporteur) {
            console.log('No transporteur found for userId:', userId);
            return [];
        }
        console.log('Found transporteur:', transporteur.id, transporteur.name);
        const shipments = await this.shipmentRepository.find({
            where: { transporteurId: transporteur.id },
            order: { createdAt: 'DESC' }
        });
        console.log('Shipments found:', shipments.length);
        return shipments;
    }
    async getStats(userId) {
        const transporteur = await this.transporteurRepository.findOne({
            where: { userId: userId }
        });
        if (!transporteur) {
            return { total: 0, pending: 0, inTransit: 0, delivered: 0, cancelled: 0 };
        }
        const shipments = await this.shipmentRepository.find({
            where: { transporteurId: transporteur.id }
        });
        const total = shipments.length;
        const pending = shipments.filter(s => s.status === 'pending').length;
        const inTransit = shipments.filter(s => s.status === 'in_transit').length;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const cancelled = shipments.filter(s => s.status === 'cancelled').length;
        return { total, pending, inTransit, delivered, cancelled };
    }
    async updateShipmentStatus(id, userId, status) {
        const transporteur = await this.transporteurRepository.findOne({
            where: { userId: userId }
        });
        if (!transporteur) {
            throw new common_1.NotFoundException('Transporteur non trouvé');
        }
        const shipment = await this.shipmentRepository.findOne({
            where: { id: id, transporteurId: transporteur.id }
        });
        if (!shipment) {
            throw new common_1.NotFoundException('Expédition non trouvée');
        }
        shipment.status = status;
        return this.shipmentRepository.save(shipment);
    }
};
exports.TransporteurService = TransporteurService;
exports.TransporteurService = TransporteurService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __param(1, (0, typeorm_1.InjectRepository)(transporteur_entity_1.Transporteur)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TransporteurService);
//# sourceMappingURL=transporteur.service.js.map