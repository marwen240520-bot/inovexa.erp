import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';

@ApiTags('Rendez-vous')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Rendez-vous d’une période (?from=&to=&status=&resource=&q=)' })
  findAll(@Request() req: any, @Query() q: any) {
    return this.appointments.findAll(req.user.userId, { from: q.from, to: q.to, status: q.status, resource: q.resource, q: q.q });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Chiffres du jour, ressources et prestations déjà utilisées' })
  summary(@Request() req: any) {
    return this.appointments.summary(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.appointments.findOne(id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crée un rendez-vous (409 SLOT_TAKEN si la ressource est déjà prise ; allowOverlap = true pour forcer)' })
  create(@Request() req: any, @Body() body: any) {
    return this.appointments.create(req.user.userId, body || {});
  }

  @Put(':id')
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.appointments.update(id, req.user.userId, body || {});
  }

  @Patch(':id/status')
  setStatus(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.appointments.setStatus(id, req.user.userId, body?.status);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.appointments.delete(id, req.user.userId);
  }
}
