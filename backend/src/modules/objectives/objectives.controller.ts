import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ObjectivesService } from './objectives.service';

@Controller('objectives')
@UseGuards(JwtAuthGuard)
export class ObjectivesController {
  constructor(private readonly service: ObjectivesService) {}

  @Get() findAll(@Request() req: any) { return this.service.findAll(req.user.userId); }
  @Post() create(@Request() req: any, @Body() body: any) { return this.service.create(req.user.userId, body); }
  @Put(':id') update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.service.update(req.user.userId, id, body); }
  @Delete(':id') remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.service.remove(req.user.userId, id); }
}
