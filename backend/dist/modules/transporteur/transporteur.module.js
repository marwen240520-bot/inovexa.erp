"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransporteurModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transporteur_controller_1 = require("./transporteur.controller");
const transporteur_service_1 = require("./transporteur.service");
const shipment_entity_1 = require("../logistics/entities/shipment.entity");
const transporteur_entity_1 = require("../transporteurs/entities/transporteur.entity");
let TransporteurModule = class TransporteurModule {
};
exports.TransporteurModule = TransporteurModule;
exports.TransporteurModule = TransporteurModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([shipment_entity_1.Shipment, transporteur_entity_1.Transporteur])],
        controllers: [transporteur_controller_1.TransporteurController],
        providers: [transporteur_service_1.TransporteurService],
        exports: [transporteur_service_1.TransporteurService],
    })
], TransporteurModule);
//# sourceMappingURL=transporteur.module.js.map