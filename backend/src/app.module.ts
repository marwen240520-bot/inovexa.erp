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
import { RfmModule } from './modules/rfm/rfm.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { ProductionModule } from './modules/production/production.module';
import { TransporteurModule } from './modules/transporteur/transporteur.module';
import { TransporteursModule } from './modules/transporteurs/transporteurs.module';
import { IaModule } from './modules/ia/ia.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'inovexa_erp',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Important: false car les tables sont déjà créées
      logging: false,
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
    RfmModule,
    EmployeesModule,
    ExpensesModule,
    LogisticsModule,
    ProductionModule,
    TransporteurModule,
    TransporteursModule,
    IaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
