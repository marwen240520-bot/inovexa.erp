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
import { StockMovementsModule } from './modules/stock_movements/stock_movements.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: 'data/inovexa.db',
        autoLoadEntities: true,
        synchronize: true,
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
    StockMovementsModule,
    WarehousesModule,
    AnalyticsModule,
    
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}



