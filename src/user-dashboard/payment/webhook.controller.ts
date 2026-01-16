/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Req, Res } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { PrismaService } from 'src/config/database/prisma.service';
import { ApiOperation } from '@nestjs/swagger';
import Stripe from 'stripe';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';

@Controller('stripe')
export class WebhookController {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook ( PUBLIC )' })
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
    
    // Handle payment failures
    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
      try {
        const session = event.data.object ;
        const metadata = session.metadata;

        if (metadata?.invoiceId) {
          const invoice = await this.prisma.invoice.findUnique({
            where: { id: metadata.invoiceId },
          });

          if (invoice) {
            await this.activityLog.log({
              userId: invoice.userId,
              type: 'PAYMENT_FAILED',
              title: `Payment failed for ${invoice.invoiceNo}`,
              amount: invoice.totalAmount,
              currency: 'EUR',
              category: 'SYSTEM',
              level: 'ERROR',
            });
          }
        } else if (metadata?.historyId) {
          const history = await this.prisma.userSubscriptionPlanHistory.findUnique({
            where: { id: metadata.historyId },
            include: { user: { include: { profile: true } } },
          });

          if (history?.user?.profile) {
            const userName = `${history.user.profile.firstName} ${history.user.profile.lastName}`;
            await this.activityLog.log({
              userId: history.UserId,
              userName,
              type: 'SUBSCRIPTION_PAYMENT_FAILED',
              title: `${userName} - Payment failed`,
              amount: history.price,
              currency: 'USD',
              category: 'ADMIN',
              level: 'ERROR',
            });
          }
        }
      } catch (error) {
        console.error('Payment failure logging error:', error);
      }
    }

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

          // Log payment received
          await this.activityLog.log({
            userId: invoice.userId,
            type: 'PAYMENT_RECEIVED',
            title: `Payment received for ${invoice.invoiceNo}`,
            amount: invoice.totalAmount,
            currency: 'EUR',
            category: 'USER',
          });

          console.log('Invoice marked as PAID:', invoiceId);
          return res.json({ received: true });
        }

        /**
         * ===============================
         * 2️⃣ SUBSCRIPTION PAYMENT (existing)
         * ===============================
         */
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
            realtimeImapChecking: history.realtimeImapChecking,
            expiredAt: expirationDate,
            isActive: true,
            subscriptionPlanPaymentStatusId:
              history.subscriptionPlanPaymentStatus.id,
          },
        });

        // Log subscription payment for admin
        const user = await this.prisma.user.findUnique({
          where: { id: history.UserId },
          include: { profile: true },
        });

        if (user?.profile) {
          const userName = `${user.profile.firstName} ${user.profile.lastName}`;
          
          // Check if this is an upgrade by looking at existing active plans
          const existingPlan = await this.prisma.userSubscriptionPlan.findFirst({
            where: {
              UserId: history.UserId,
              isActive: true,
            },
          });

          const activityType = existingPlan ? 'PLAN_UPGRADED' : 'SUBSCRIPTION_PAYMENT_RECEIVED';
          const activityTitle = existingPlan 
            ? `${userName} - Upgraded to ${history.planName} plan`
            : `${userName} - Payment received`;

          await this.activityLog.log({
            userId: history.UserId,
            userName,
            type: activityType,
            title: activityTitle,
            amount: history.price,
            currency: 'USD',
            category: 'ADMIN',
          });

          // Log to user activities
          await this.activityLog.log({
            userId: history.UserId,
            userName,
            type: activityType,
            title: existingPlan ? `Upgraded to ${history.planName} plan` : 'Payment received',
            amount: history.price,
            currency: 'USD',
            category: 'USER',
          });
        }

        console.log('Subscription created for user:', history.UserId);
      } catch (error) {
        console.log('Webhook error:', error);
      }
    }

    res.json({ received: true });
  }
}
