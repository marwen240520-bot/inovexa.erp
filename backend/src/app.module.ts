import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { buildTypeOrmOptions, isSynchronizeEnabled } from './database/typeorm.config';
import { UserThrottlerGuard } from './common/user-throttler.guard';
import { AccessGuard } from './modules/auth/access.guard';
import { AuditModule } from './common/audit/audit.module';
import { MailModule } from './common/mail/mail.service';
import { CompanyModule } from './modules/company/company.module';
import { StockModule } from './modules/stock/stock.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ProductionModule } from './modules/production/production.module';
import { TeamModule } from './modules/team/team.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AccountingModule } from './modules/accounting/accounting.module';
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
import { WorkspaceSearchModule } from './modules/workspace-search/workspace-search.module';
import { assertUniqueEntityTables } from './common/assert-unique-entities';

// Échoue tout de suite, avec un message clair, si deux entités visent la même table
assertUniqueEntityTables(__dirname);
import { LogisticsModule } from './modules/logistics/logistics.module';
import { TransporteurModule } from './modules/transporteur/transporteur.module';
import { TransporteursModule } from './modules/transporteurs/transporteurs.module';
import { IaModule } from './modules/ia/ia.module';
import { UploadModule } from './modules/upload/upload.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { runPreSyncFixes } from './common/pre-sync-fixes';
import { PosModule } from './modules/pos/pos.module';
import { ObjectivesModule } from './modules/objectives/objectives.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        // En développement (synchronize) : convertit sur place les colonnes dont le type diffère de l'entité
        // (évite le « drop + recréation » de TypeORM). En production, ce sont les migrations qui font foi.
        if (isSynchronizeEnabled()) await runPreSyncFixes(process.env.DATABASE_URL);
        return buildTypeOrmOptions();
      },
    }),
    // Limite de débit : par personne connectée (sinon par IP). Protège l'API contre les abus.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: (ctx: any) => (ctx.switchToHttp().getRequest()?.user ? 900 : 120),
      },
    ]),
    AuditModule,
    MailModule,
    CompanyModule,
    StockModule,
    FinanceModule,
    ProductionModule,
    TeamModule,
    DocumentsModule,
    AccountingModule,
    PosModule,
    ObjectivesModule,
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
    WorkspaceSearchModule,
    LogisticsModule,
    TransporteurModule,
    TransporteursModule,
    IaModule,
    UploadModule,
    DepartmentsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Ordre important : d'abord l'authentification + droits, ensuite la limitation de débit (qui a besoin de savoir QUI appelle).
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}

