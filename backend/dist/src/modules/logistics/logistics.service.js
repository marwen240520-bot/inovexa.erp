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
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shipment_entity_1 = require("./entities/shipment.entity");
let LogisticsService = class LogisticsService {
    constructor(shipmentRepository) {
        this.shipmentRepository = shipmentRepository;
    }
    async findAllByClient(clientId) {
        return this.shipmentRepository.find({
            where: { clientId: clientId },
            order: { createdAt: 'DESC' }
        });
    }
    async findAllByTransporteur(transporteurId) {
        return this.shipmentRepository.find({
            where: { transporteurId: transporteurId },
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id, clientId) {
        const shipment = await this.shipmentRepository.findOne({ where: { id: id, clientId: clientId } });
        if (!shipment)
            throw new common_1.NotFoundException('Expédition non trouvée');
        return shipment;
    }
    async create(clientId, data) {
        const existing = await this.shipmentRepository.findOne({
            where: { trackingNumber: data.trackingNumber }
        });
        if (existing)
            throw new common_1.ConflictException('Ce numéro de suivi existe déjà');
        const shipment = this.shipmentRepository.create({
            clientId: clientId,
            trackingNumber: data.trackingNumber,
            clientName: data.clientName,
            address: data.address,
            phone: data.phone || null,
            amount: data.amount || 0,
            transporteurId: data.transporteurId || null,
            estimatedDelivery: data.estimatedDelivery || null,
            status: data.status || 'pending'
        });
        return this.shipmentRepository.save(shipment);
    }
    async assignToTransporteur(id, clientId, transporteurId) {
        const shipment = await this.findOne(id, clientId);
        shipment.transporteurId = transporteurId;
        return this.shipmentRepository.save(shipment);
    }
    async updateStatus(id, clientId, status) {
        const shipment = await this.findOne(id, clientId);
        shipment.status = status;
        return this.shipmentRepository.save(shipment);
    }
    async updateStatusByTransporteur(id, transporteurId, status) {
        const shipment = await this.shipmentRepository.findOne({
            where: { id: id, transporteurId: transporteurId }
        });
        if (!shipment)
            throw new common_1.NotFoundException('Expédition non trouvée ou non assignée');
        shipment.status = status;
        return this.shipmentRepository.save(shipment);
    }
    async update(id, clientId, data) {
        const shipment = await this.findOne(id, clientId);
        if (data.trackingNumber !== undefined)
            shipment.trackingNumber = data.trackingNumber;
        if (data.clientName !== undefined)
            shipment.clientName = data.clientName;
        if (data.address !== undefined)
            shipment.address = data.address;
        if (data.phone !== undefined)
            shipment.phone = data.phone;
        if (data.amount !== undefined)
            shipment.amount = data.amount;
        if (data.transporteurId !== undefined)
            shipment.transporteurId = data.transporteurId;
        if (data.estimatedDelivery !== undefined)
            shipment.estimatedDelivery = data.estimatedDelivery;
        if (data.status !== undefined)
            shipment.status = data.status;
        return this.shipmentRepository.save(shipment);
    }
    async delete(id, clientId) {
        const shipment = await this.findOne(id, clientId);
        await this.shipmentRepository.delete(id);
        return { success: true };
    }
};
exports.LogisticsService = LogisticsService;
exports.LogisticsService = LogisticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shipment_entity_1.Shipment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogisticsService);
//# sourceMappingURL=logistics.service.js.map