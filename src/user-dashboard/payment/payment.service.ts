import { BadRequestException, Injectable } from '@nestjs/common';
// import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { StripeService } from './stripe.service';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import Stripe from 'stripe';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async buyPlan(
    userId: string,
    subscriptionPlanId: string,
    billingPeriod: 'MONTHLY' | 'YEARLY',
    user: jwtPayload,
  ) {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId },
        include: {
          packagePricing: {
            where: { billingPeriod },
          },
        },
      });

      if (!plan || !plan.isActive) {
        throw new BadRequestException('Invalid subscription plan');
      }

      const pricing = plan.packagePricing[0];
      if (!pricing) {
        throw new BadRequestException(
          'Pricing not found for selected billing period',
        );
      }

      // 🔑 Stripe Price ID must be stored in DB
      if (!pricing.stripePriceId) {
        throw new BadRequestException('Stripe price not configured');
      }

      const payment = await this.prisma.userSubscriptionPlanHistory.create({
        data: {
          UserId: userId,
          planName: plan.planName,
          isLimitedInvoicePerMonth: pricing.isLimitedInvoicePerMonth,
          perMonthInvoiceCount: pricing.perMonthInvoiceCount,
          realtimeImapChecking: pricing.invoiceAutoSyncIntervalIds,
          price: pricing.price,
          setupFee: pricing.setupFee,
          freeTrialDays: pricing.freeTrialDays,
          billingPeriod,
          subscriptionPlanPaymentStatus: {
            create: {
              paymentStatus: 'PENDING',
              totalAmount: pricing.price + pricing.setupFee,
            },
          },
        },
        include: {
          subscriptionPlanPaymentStatus: true,
        },
      });

      let stripePrice: Stripe.Response<Stripe.Price>;
      try {
        stripePrice = await this.stripeService.getPrice(pricing.stripePriceId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        stripePrice = await this.stripeService.createPrice({
          amount: Math.round((pricing.price + pricing.setupFee) * 100),
          currency: 'usd',
          recurring: {
            interval: billingPeriod === 'MONTHLY' ? 'month' : 'year',
          },
          product_data: {
            name: plan.planName,
          },
        });

        await this.prisma.packagePricing.update({
          where: { id: pricing.id },
          data: { stripePriceId: stripePrice.id },
        });
      }

      const session = await this.stripeService.createSubscriptionCheckout(
        stripePrice.id,
        user.email,
        {
          userId,
          planId: plan.id,
          historyId: payment.id,
          billingPeriod,
        },
      );

      await this.prisma.subscriptionPlanPaymentStatus.update({
        where: {
          id: payment.subscriptionPlanPaymentStatus?.id,
        },
        data: {
          stripeSessionId: session.id,
        },
      });

      return cResponseData({
        checkoutUrl: session.url,
        data: session.url,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to create checkout session',
        error: 'Failed to create checkout session',
      });
    }
  }

  // findAll() {
  //   return `This action returns all payment`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} payment`;
  // }

  // update(id: number, updatePaymentDto: UpdatePaymentDto) {
  //   return `This action updates a #${id} payment`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} payment`;
  // }
}
