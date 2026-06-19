"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransporteursModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transporteurs_controller_1 = require("./transporteurs.controller");
const transporteurs_service_1 = require("./transporteurs.service");
const transporteur_entity_1 = require("./entities/transporteur.entity");
const user_entity_1 = require("../users/entities/user.entity");
let TransporteursModule = class TransporteursModule {
};
exports.TransporteursModule = TransporteursModule;
exports.TransporteursModule = TransporteursModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([transporteur_entity_1.Transporteur, user_entity_1.User])],
        controllers: [transporteurs_controller_1.TransporteursController],
        providers: [transporteurs_service_1.TransporteursService],
        exports: [transporteurs_service_1.TransporteursService],
    })
], TransporteursModule);
//# sourceMappingURL=transporteurs.module.js.map