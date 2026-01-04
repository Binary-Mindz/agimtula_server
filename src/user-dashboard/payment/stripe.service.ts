import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async getPrice(priceId: string) {
    return await this.stripe.prices.retrieve(priceId);
  }

  async createPrice(params: {
    amount: number;
    currency: string;
    recurring: { interval: 'month' | 'year' };
    product_data: { name: string };
  }) {
    return await this.stripe.prices.create({
      unit_amount: params.amount,
      currency: params.currency,
      recurring: params.recurring,
      product_data: params.product_data,
    });
  }

  createSubscriptionCheckout(
    priceId: string,
    customerEmail: string,
    metadata: Record<string, string>,
  ) {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: customerEmail,

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata,

      success_url: `${process.env.FRONTEND_URL}/billing/success`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
    });
  }
}
