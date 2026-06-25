"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const orders_module_1 = require("./modules/orders/orders.module");
const clients_module_1 = require("./modules/clients/clients.module");
const invoices_module_1 = require("./modules/invoices/invoices.module");
const reports_module_1 = require("./modules/reports/reports.module");
const sales_module_1 = require("./modules/sales/sales.module");
const purchases_module_1 = require("./modules/purchases/purchases.module");
const categories_module_1 = require("./modules/categories/categories.module");
const suppliers_module_1 = require("./modules/suppliers/suppliers.module");
const admin_module_1 = require("./modules/admin/admin.module");
const customers_module_1 = require("./modules/customers/customers.module");
const export_module_1 = require("./modules/export/export.module");
const search_module_1 = require("./modules/search/search.module");
const employees_module_1 = require("./modules/employees/employees.module");
const expenses_module_1 = require("./modules/expenses/expenses.module");
const logistics_module_1 = require("./modules/logistics/logistics.module");
const transporteur_module_1 = require("./modules/transporteur/transporteur.module");
const transporteurs_module_1 = require("./modules/transporteurs/transporteurs.module");
const production_module_1 = require("./modules/production/production.module");
const ia_module_1 = require("./modules/ia/ia.module");
const upload_module_1 = require("./modules/upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_DATABASE || 'inovexa_erp',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: false,
                logging: false,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            clients_module_1.ClientsModule,
            invoices_module_1.InvoicesModule,
            reports_module_1.ReportsModule,
            sales_module_1.SalesModule,
            purchases_module_1.PurchasesModule,
            categories_module_1.CategoriesModule,
            suppliers_module_1.SuppliersModule,
            admin_module_1.AdminModule,
            customers_module_1.CustomersModule,
            export_module_1.ExportModule,
            search_module_1.SearchModule,
            employees_module_1.EmployeesModule,
            expenses_module_1.ExpensesModule,
            logistics_module_1.LogisticsModule,
            transporteur_module_1.TransporteurModule,
            transporteurs_module_1.TransporteursModule,
            production_module_1.ProductionModule,
            ia_module_1.IaModule,
            upload_module_1.UploadModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map