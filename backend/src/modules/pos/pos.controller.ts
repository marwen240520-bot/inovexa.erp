import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PosService } from './pos.service';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Caisse (POS)')
@ApiBearerAuth()
@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  /** POST /pos/checkout  { mode: "sale" | "purchase", lines: [{ productId, quantity, unitPrice? }], counterpart?, paymentMethod? } */
  @Post('checkout')
  checkout(@Request() req: any, @Body() body: any) {
    return this.posService.checkout(req.user.userId, body);
  }

  @Get('sessions/current')
  current(@Request() req: any) { return this.posService.currentSession(req.user.userId); }

  @Post('sessions/open')
  open(@Request() req: any, @Body() body: any) { return this.posService.openSession(req.user.userId, req.user.actorId ?? req.user.userId, body || {}); }

  @Post('sessions/close')
  close(@Request() req: any, @Body() body: any) { return this.posService.closeSession(req.user.userId, req.user.actorId ?? req.user.userId, body || {}); }

  @Get('sessions')
  sessions(@Request() req: any) { return this.posService.listSessions(req.user.userId); }

  @Get('sessions/:id')
  session(@Request() req: any, @Param('id', ParseIntPipe) id: number) { return this.posService.getSession(req.user.userId, id); }

  @Get('tickets/:ticketNumber')
  ticket(@Request() req: any, @Param('ticketNumber') ticketNumber: string) { return this.posService.ticket(req.user.userId, ticketNumber); }

  @Get('today')
  today(@Request() req: any) {
    return this.posService.today(req.user.userId);
  }
}
