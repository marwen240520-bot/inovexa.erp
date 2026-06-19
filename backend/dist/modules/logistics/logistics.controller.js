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
exports.LogisticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const logistics_service_1 = require("./logistics.service");
let LogisticsController = class LogisticsController {
    constructor(logisticsService) {
        this.logisticsService = logisticsService;
    }
    async getClientShipments(req) {
        if (req.user.role !== 'client') {
            return { error: 'Accès réservé aux clients' };
        }
        return this.logisticsService.findAllByClient(req.user.userId);
    }
    async getTransporteurShipments(req) {
        if (req.user.role !== 'transporteur') {
            return { error: 'Accès réservé aux transporteurs' };
        }
        return this.logisticsService.findAllByTransporteur(req.user.userId);
    }
    async findOne(id, req) {
        return this.logisticsService.findOne(parseInt(id), req.user.userId);
    }
    async create(req, body) {
        if (req.user.role !== 'client') {
            return { error: 'Seuls les clients peuvent créer des expéditions' };
        }
        return this.logisticsService.create(req.user.userId, body);
    }
    async update(id, req, body) {
        return this.logisticsService.update(parseInt(id), req.user.userId, body);
    }
    async assignToTransporteur(id, req, body) {
        return this.logisticsService.assignToTransporteur(parseInt(id), req.user.userId, body.transporteurId);
    }
    async updateStatus(id, req, body) {
        return this.logisticsService.updateStatus(parseInt(id), req.user.userId, body.status);
    }
    async updateStatusByTransporteur(id, req, body) {
        if (req.user.role !== 'transporteur') {
            return { error: 'Accès réservé aux transporteurs' };
        }
        return this.logisticsService.updateStatusByTransporteur(parseInt(id), req.user.userId, body.status);
    }
    async delete(id, req) {
        return this.logisticsService.delete(parseInt(id), req.user.userId);
    }
};
exports.LogisticsController = LogisticsController;
__decorate([
    (0, common_1.Get)('client/shipments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getClientShipments", null);
__decorate([
    (0, common_1.Get)('transporteur/shipments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "getTransporteurShipments", null);
__decorate([
    (0, common_1.Get)('client/shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('client/shipments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('client/shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('client/shipments/:id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "assignToTransporteur", null);
__decorate([
    (0, common_1.Patch)('client/shipments/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('transporteur/shipments/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "updateStatusByTransporteur", null);
__decorate([
    (0, common_1.Delete)('client/shipments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LogisticsController.prototype, "delete", null);
exports.LogisticsController = LogisticsController = __decorate([
    (0, common_1.Controller)('logistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [logistics_service_1.LogisticsService])
], LogisticsController);
//# sourceMappingURL=logistics.controller.js.map