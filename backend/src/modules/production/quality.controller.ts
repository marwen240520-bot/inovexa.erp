import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QualityService } from './quality.service';
import { QualityControl } from './entities/quality-control.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('production/quality')
@UseGuards(AuthGuard('jwt'))
export class QualityController {
  constructor(private qualityService: QualityService) {}

  @Get()
  findAll() {
    return this.qualityService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.qualityService.findById(id);
  }

  @Get('work-order/:workOrderId')
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.qualityService.findByWorkOrder(workOrderId);
  }

  @Post()
  create(@Body() data: Partial<QualityControl>) {
    return this.qualityService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<QualityControl>) {
    return this.qualityService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.qualityService.delete(id);
  }
}
