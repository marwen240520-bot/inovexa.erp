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
exports.ClientModulesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const client_modules_service_1 = require("./client-modules.service");
let ClientModulesController = class ClientModulesController {
    constructor(clientModulesService) {
        this.clientModulesService = clientModulesService;
    }
    async getMyModules(req) {
        return this.clientModulesService.getModulesByClient(req.user.userId);
    }
    async getClientModules(clientId, req) {
        if (req.user.role !== 'admin') {
            return { error: 'Unauthorized access' };
        }
        return this.clientModulesService.getModulesByClient(parseInt(clientId));
    }
    async updateClientModules(clientId, req, body) {
        if (req.user.role !== 'admin') {
            return { error: 'Unauthorized access' };
        }
        const result = await this.clientModulesService.updateModules(parseInt(clientId), body);
        return { success: true, data: result };
    }
    async resetClientModules(clientId, req) {
        if (req.user.role !== 'admin') {
            return { error: 'Unauthorized access' };
        }
        return this.clientModulesService.resetModules(parseInt(clientId));
    }
    async getAllConfig(req) {
        if (req.user.role !== 'admin') {
            return { error: 'Unauthorized access' };
        }
        return this.clientModulesService.getAllModulesConfig();
    }
    async checkModule(module, req) {
        return this.clientModulesService.getModuleStatus(req.user.userId, module);
    }
};
exports.ClientModulesController = ClientModulesController;
__decorate([
    (0, common_1.Get)('my-modules'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "getMyModules", null);
__decorate([
    (0, common_1.Get)('client/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "getClientModules", null);
__decorate([
    (0, common_1.Put)('client/:clientId'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "updateClientModules", null);
__decorate([
    (0, common_1.Delete)('client/:clientId/reset'),
    __param(0, (0, common_1.Param)('clientId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "resetClientModules", null);
__decorate([
    (0, common_1.Get)('all/config'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "getAllConfig", null);
__decorate([
    (0, common_1.Get)('check/:module'),
    __param(0, (0, common_1.Param)('module')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClientModulesController.prototype, "checkModule", null);
exports.ClientModulesController = ClientModulesController = __decorate([
    (0, common_1.Controller)('client-modules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [client_modules_service_1.ClientModulesService])
], ClientModulesController);
//# sourceMappingURL=client-modules.controller.js.map