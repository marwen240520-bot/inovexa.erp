import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ClientsModule } from './modules/clients/clients.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SalesModule } from './modules/sales/sales.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AdminModule } from './modules/admin/admin.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ExportModule } from './modules/export/export.module';
import { SearchModule } from './modules/search/search.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { TransporteurModule } from './modules/transporteur/transporteur.module';
import { TransporteursModule } from './modules/transporteurs/transporteurs.module';
import { ProductionModule } from './modules/production/production.module';
import { IaModule } from './modules/ia/ia.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
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
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    ClientsModule,
    InvoicesModule,
    ReportsModule,
    SalesModule,
    PurchasesModule,
    CategoriesModule,
    SuppliersModule,
    AdminModule,
    CustomersModule,
    ExportModule,
    SearchModule,
    EmployeesModule,
    ExpensesModule,
    LogisticsModule,
    TransporteurModule,
    TransporteursModule,
    ProductionModule,
    IaModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

