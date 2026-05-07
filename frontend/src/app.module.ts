import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProductsModule } from './modules/products/products.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { AuditLogsModule } from './modules/auditlogs/auditlogs.module';
import { BomModule } from './modules/bom/bom.module';
import { WorkOrdersModule } from './modules/work_orders/work_orders.module';
import { QualityControlModule } from './modules/quality_control/quality_control.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { AiPredictionsModule } from './modules/ai_predictions/ai_predictions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmailModule } from './modules/email/email.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { PurchaseOrdersModule } from './modules/purchase_orders/purchase_orders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { StockMovementsModule } from './modules/stock_movements/stock_movements.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { SearchModule } from './modules/search/search.module';
import { ExportModule } from './modules/export/export.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrderItemsModule } from './modules/order_items/order_items.module';
import { HealthController } from './modules/health/health.controller';
import { EncryptionService } from './common/services/encryption.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'inovexa'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ClientsModule,
    ProductsModule,
    InvoicesModule,
    EmployeesModule,
    OrdersModule,
    SuppliersModule,
    CategoriesModule,
    PaymentsModule,
    LeavesModule,
    AuditLogsModule,
    BomModule,
    WorkOrdersModule,
    QualityControlModule,
    ShipmentsModule,
    AiPredictionsModule,
    AnalyticsModule,
    EmailModule,
    QuotesModule,
    PurchaseOrdersModule,
    NotificationsModule,
    StockMovementsModule,
    WarehousesModule,
    PayrollModule,
    SearchModule,
    ExportModule,
    CustomersModule,
    OrderItemsModule,
  ],
  controllers: [HealthController],
  providers: [EncryptionService],
})
export class AppModule {}
