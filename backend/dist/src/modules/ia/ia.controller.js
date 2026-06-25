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
exports.IaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const ia_service_1 = require("./ia.service");
let IaController = class IaController {
    constructor(iaService) {
        this.iaService = iaService;
    }
    async getChatHistory(req) {
        return this.iaService.getChatHistory(req.user.userId);
    }
    async saveChatMessage(req, body) {
        return this.iaService.saveChatMessage(req.user.userId, body.role, body.content);
    }
    async getAlerts(req) {
        return this.iaService.getAlerts(req.user.userId);
    }
    async getComparisonStats(req) {
        return this.iaService.getComparisonStats(req.user.userId);
    }
    async exportAnalytics(req) {
        return this.iaService.exportAnalytics(req.user.userId);
    }
    async getPredictions(req) {
        return this.iaService.getPredictions(req.user.userId);
    }
    async getForecast(req, period, scenario) {
        return this.iaService.getForecast(req.user.userId, period, scenario);
    }
};
exports.IaController = IaController;
__decorate([
    (0, common_1.Get)('chat/history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Post)('chat/save'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "saveChatMessage", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('stats/compare'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "getComparisonStats", null);
__decorate([
    (0, common_1.Get)('export/analytics'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "exportAnalytics", null);
__decorate([
    (0, common_1.Get)('predictions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "getPredictions", null);
__decorate([
    (0, common_1.Get)('forecast'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('period')),
    __param(2, (0, common_1.Query)('scenario')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], IaController.prototype, "getForecast", null);
exports.IaController = IaController = __decorate([
    (0, common_1.Controller)('ia'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ia_service_1.IaService])
], IaController);
//# sourceMappingURL=ia.controller.js.map