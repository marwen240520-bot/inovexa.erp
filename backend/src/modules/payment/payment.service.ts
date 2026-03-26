import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    // Si la clé Stripe n'est pas configurée, on utilise un mode mock
    if (stripeKey && stripeKey !== 'sk_test_dummy_key_for_development') {
      this.stripe = new Stripe(stripeKey);
      // Pas besoin de spécifier apiVersion, Stripe utilise la dernière version
    } else {
      console.log('⚠️  Mode développement: Stripe est désactivé');
    }
  }

  async createPaymentIntent(amount: number, currency: string) {
    if (!this.stripe) {
      // Mode mock - retourner un faux payment intent
      return {
        clientSecret: 'mock_client_secret_' + Date.now(),
        paymentIntentId: 'mock_pi_' + Date.now(),
      };
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async createCheckoutSession(invoiceId: string, amount: number) {
    if (!this.stripe) {
      // Mode mock
      return {
        url: process.env.FRONTEND_URL + '/payment/success?invoice_id=' + invoiceId,
        sessionId: 'mock_session_' + Date.now(),
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Facture #' + invoiceId,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/payment/success?invoice_id=' + invoiceId,
      cancel_url: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/payment/cancel',
      metadata: {
        invoiceId: invoiceId,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) {
      console.log('⚠️  Mode mock: Webhook ignoré');
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }
    
    let event: Stripe.Event;
    
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new Error('Webhook signature verification failed: ' + err.message);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.handlePaymentSuccess(paymentIntent);
        break;
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutComplete(session);
        break;
      default:
        console.log('Unhandled event type: ' + event.type);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment succeeded: ' + paymentIntent.id);
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    console.log('Checkout completed: ' + session.id);
  }
}
