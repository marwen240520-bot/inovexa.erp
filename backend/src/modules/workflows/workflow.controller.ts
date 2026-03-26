import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Workflow } from './workflow.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('workflows')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Workflow>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Workflow>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post('trigger/:trigger')
  async trigger(@Param('trigger') trigger: string, @Body() data: any) {
    await this.service.execute(trigger, data);
    return { success: true };
  }
}
