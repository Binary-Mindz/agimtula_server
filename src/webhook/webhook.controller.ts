/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PrismaService } from 'src/config/database/prisma.service';
import Stripe from 'stripe';

@Controller('stripe')
export class WebhookController {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: any, @Res() res: any) {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Webhook event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      try {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Session completed:', session.id);

        const historyId = session.metadata?.historyId;
        if (!historyId) {
          console.error('No historyId in metadata');
          return res.json({ received: true, error: 'No historyId' });
        }

        await this.prisma.subscriptionPlanPaymentStatus.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            paymentStatus: 'PAID',
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          },
        });

        const history =
          await this.prisma.userSubscriptionPlanHistory.findUnique({
            where: { id: historyId },
            include: {
              subscriptionPlanPaymentStatus: true,
            },
          });

        if (!history || !history.subscriptionPlanPaymentStatus?.id) {
          console.error('History or payment status not found');
          return res.json({ received: true, error: 'History not found' });
        }

        // Calculate expiration date
        const expirationDate = new Date();
        if (history.billingPeriod === 'MONTHLY') {
          expirationDate.setMonth(expirationDate.getMonth() + 1);
        } else {
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        await this.prisma.userSubscriptionPlan.create({
          data: {
            UserId: history.UserId,
            planName: history.planName,
            price: history.price,
            setupFee: history.setupFee,
            isLimitedInvoicePerMonth: history.isLimitedInvoicePerMonth,
            perMonthInvoiceCount: history.perMonthInvoiceCount,
            expiredAt: expirationDate,
            isActive: true,
            subscriptionPlanPaymentStatusId:
              history.subscriptionPlanPaymentStatus.id,
          },
        });

        console.log('Subscription created for user:', history.UserId);
      } catch (error) {
        console.log(error);
      }
    }

    res.json({ received: true });
  }
}
