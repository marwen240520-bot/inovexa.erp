import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import type { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { amount: number; currency: string }) {
    return this.paymentService.createPaymentIntent(body.amount, body.currency);
  }

  @Post('create-checkout-session')
  async createCheckoutSession(@Body() body: { invoiceId: string; amount: number }) {
    return this.paymentService.createCheckoutSession(body.invoiceId, body.amount);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request,
  ) {
    const payload = request.body;
    await this.paymentService.handleWebhook(signature, payload);
    return { received: true };
  }
}
