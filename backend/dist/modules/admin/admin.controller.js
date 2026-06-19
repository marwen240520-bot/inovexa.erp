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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_service_1 = require("./admin.service");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllClients(req) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.getAllClients();
    }
    async getClientById(id, req) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.getClientById(parseInt(id));
    }
    async createClient(req, body) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.createClient(body);
    }
    async updateClient(id, req, body) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.updateClient(parseInt(id), body);
    }
    async extendSubscription(id, req, body) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.extendSubscription(parseInt(id), body.days);
    }
    async updateClientModules(id, req, body) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.updateClientModules(parseInt(id), body.modules);
    }
    async deleteClient(id, req) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.deleteClient(parseInt(id));
    }
    async toggleClientStatus(id, req) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.toggleClientStatus(parseInt(id));
    }
    async getAdminStats(req) {
        if (req.user.role !== 'admin')
            return { error: 'Accès non autorisé' };
        return this.adminService.getAdminStats();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('clients'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllClients", null);
__decorate([
    (0, common_1.Get)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClientById", null);
__decorate([
    (0, common_1.Post)('clients'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createClient", null);
__decorate([
    (0, common_1.Patch)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClient", null);
__decorate([
    (0, common_1.Patch)('clients/:id/extend'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "extendSubscription", null);
__decorate([
    (0, common_1.Patch)('clients/:id/modules'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClientModules", null);
__decorate([
    (0, common_1.Delete)('clients/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClient", null);
__decorate([
    (0, common_1.Patch)('clients/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "toggleClientStatus", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminStats", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map