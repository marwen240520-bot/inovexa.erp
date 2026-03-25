import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { Shipment } from './entities/shipment.entity';

@Controller('logistics')
export class LogisticsController {
  constructor(private logisticsService: LogisticsService) {}

  @Get('shipments')
  findAllShipments() {
    return this.logisticsService.findAllShipments();
  }

  @Post('shipments')
  createShipment(@Body() data: Partial<Shipment>) {
    return this.logisticsService.createShipment(data);
  }

  @Put('shipments/:id')
  updateShipment(@Param('id') id: string, @Body() data: Partial<Shipment>) {
    return this.logisticsService.updateShipment(id, data);
  }

  @Delete('shipments/:id')
  deleteShipment(@Param('id') id: string) {
    return this.logisticsService.deleteShipment(id);
  }
}
