import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModuleController } from './customers.controller';
import { CustomersModuleService } from './customers.service';
import { CustomersModuleEntity } from './entities/customers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomersModuleEntity])],
  controllers: [CustomersModuleController],
  providers: [CustomersModuleService],
  exports: [CustomersModuleService],
})
export class CustomersModule {}
