import { Controller, Post, Req, Res } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { PrismaService } from 'src/config/database/prisma.service';
import { ApiOperation } from '@nestjs/swagger';
import Stripe from 'stripe';

@Controller('stripe')
export class WebhookController {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook ( PUBLIC )' })
  async handleWebhook(@Req() req: any, @Res() res: any) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
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

        if (session.metadata?.invoiceId) {
          const invoiceId = session.metadata.invoiceId;

          const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
          });

          if (!invoice) {
            console.error('Invoice not found:', invoiceId);
            return res.json({ received: true });
          }

          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              isPaid: true,
              paidAt: new Date(),
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
            },
          });

          console.log('Invoice marked as PAID:', invoiceId);
          return res.json({ received: true });
        }

        const historyId = session.metadata?.historyId;
        if (!historyId) {
          console.error('No historyId in metadata');
          return res.json({ received: true });
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
          return res.json({ received: true });
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
        console.log('Webhook error:', error);
      }
    }

    res.json({ received: true });
  }
}
