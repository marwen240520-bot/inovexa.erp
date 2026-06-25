"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ia_controller_1 = require("./ia.controller");
const ia_service_1 = require("./ia.service");
const ia_chat_entity_1 = require("./entities/ia-chat.entity");
const sale_entity_1 = require("../sales/entities/sale.entity");
const purchase_entity_1 = require("../purchases/entities/purchase.entity");
const product_entity_1 = require("../products/product.entity");
const client_entity_1 = require("../clients/entities/client.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
let IaModule = class IaModule {
};
exports.IaModule = IaModule;
exports.IaModule = IaModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                ia_chat_entity_1.IaChat,
                sale_entity_1.Sale,
                purchase_entity_1.Purchase,
                product_entity_1.Product,
                client_entity_1.Client,
                order_entity_1.Order,
                invoice_entity_1.Invoice
            ])
        ],
        controllers: [ia_controller_1.IaController],
        providers: [ia_service_1.IaService],
        exports: [ia_service_1.IaService],
    })
], IaModule);
//# sourceMappingURL=ia.module.js.map