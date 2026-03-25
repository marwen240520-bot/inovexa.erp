import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ProductionService } from './production.service';
import { BOM } from './entities/bom.entity';
import { WorkOrder } from './entities/work-order.entity';

@Controller('production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get('bom')
  findAllBOM() {
    return this.productionService.findAllBOM();
  }

  @Post('bom')
  createBOM(@Body() data: Partial<BOM>) {
    return this.productionService.createBOM(data);
  }

  @Get('work-orders')
  findAllWorkOrders() {
    return this.productionService.findAllWorkOrders();
  }

  @Post('work-orders')
  createWorkOrder(@Body() data: Partial<WorkOrder>) {
    return this.productionService.createWorkOrder(data);
  }

  @Put('work-orders/:id')
  updateWorkOrder(@Param('id') id: string, @Body() data: Partial<WorkOrder>) {
    return this.productionService.updateWorkOrder(id, data);
  }

  @Delete('work-orders/:id')
  deleteWorkOrder(@Param('id') id: string) {
    return this.productionService.deleteWorkOrder(id);
  }
}
