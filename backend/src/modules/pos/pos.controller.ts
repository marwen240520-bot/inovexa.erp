import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PosService } from './pos.service';

@Controller('pos')
@UseGuards(JwtAuthGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  /** POST /pos/checkout  { mode: "sale" | "purchase", lines: [{ productId, quantity, unitPrice? }], counterpart?, paymentMethod? } */
  @Post('checkout')
  checkout(@Request() req: any, @Body() body: any) {
    return this.posService.checkout(req.user.userId, body);
  }

  @Get('today')
  today(@Request() req: any) {
    return this.posService.today(req.user.userId);
  }
}
