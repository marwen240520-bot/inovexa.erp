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
const production_module_1 = require("./modules/production/production.module");
const transporteur_module_1 = require("./modules/transporteur/transporteur.module");
const transporteurs_module_1 = require("./modules/transporteurs/transporteurs.module");
const ia_module_1 = require("./modules/ia/ia.module");
const user_entity_1 = require("./modules/users/entities/user.entity");
const product_entity_1 = require("./modules/products/product.entity");
const client_entity_1 = require("./modules/clients/entities/client.entity");
const category_entity_1 = require("./modules/categories/category.entity");
const supplier_entity_1 = require("./modules/suppliers/supplier.entity");
const order_entity_1 = require("./modules/orders/entities/order.entity");
const invoice_entity_1 = require("./modules/invoices/entities/invoice.entity");
const sale_entity_1 = require("./modules/sales/entities/sale.entity");
const purchase_entity_1 = require("./modules/purchases/entities/purchase.entity");
const employee_entity_1 = require("./modules/employees/entities/employee.entity");
const expense_entity_1 = require("./modules/expenses/entities/expense.entity");
const shipment_entity_1 = require("./modules/logistics/entities/shipment.entity");
const production_order_entity_1 = require("./modules/production/entities/production-order.entity");
const transporteur_entity_1 = require("./modules/transporteurs/entities/transporteur.entity");
const ia_chat_entity_1 = require("./modules/ia/entities/ia-chat.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'postgres',
                password: 'postgres',
                database: 'inovexa_erp',
                entities: [user_entity_1.User, product_entity_1.Product, client_entity_1.Client, category_entity_1.Category, supplier_entity_1.Supplier, order_entity_1.Order, invoice_entity_1.Invoice, sale_entity_1.Sale, purchase_entity_1.Purchase, employee_entity_1.Employee, expense_entity_1.Expense, shipment_entity_1.Shipment, production_order_entity_1.ProductionOrder, transporteur_entity_1.Transporteur, ia_chat_entity_1.IaChat],
                synchronize: false,
                logging: false,
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
            production_module_1.ProductionModule,
            transporteur_module_1.TransporteurModule,
            transporteurs_module_1.TransporteursModule,
            ia_module_1.IaModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map