import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrders } from './work_orders.entity';
import { WorkOrdersService } from './work_orders.service';
import { WorkOrdersController } from './work_orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrders])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
