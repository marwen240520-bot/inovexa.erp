"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientModulesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const client_modules_controller_1 = require("./client-modules.controller");
const client_modules_service_1 = require("./client-modules.service");
const client_modules_entity_1 = require("./entities/client-modules.entity");
let ClientModulesModule = class ClientModulesModule {
};
exports.ClientModulesModule = ClientModulesModule;
exports.ClientModulesModule = ClientModulesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([client_modules_entity_1.ClientModules])],
        controllers: [client_modules_controller_1.ClientModulesController],
        providers: [client_modules_service_1.ClientModulesService],
        exports: [client_modules_service_1.ClientModulesService],
    })
], ClientModulesModule);
//# sourceMappingURL=client-modules.module.js.map