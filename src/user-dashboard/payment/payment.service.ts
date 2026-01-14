import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { StripeService } from './stripe.service';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import Stripe from 'stripe';
import { cResponseData } from 'src/common/cResponse';
import {
  NotFoundAppException,
  ValidationException,
  PaymentException,
  ConflictAppException,
} from 'src/common/app-exceptions';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) { }

  async buyPlan(
    userId: string,
    subscriptionPlanId: string,
    billingPeriod: 'MONTHLY' | 'YEARLY',
    user: jwtPayload,
  ) {
    try {
      if (!userId || !subscriptionPlanId) {
        throw new ValidationException('User ID and subscription plan ID are required');
      }

      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId },
        include: {
          packagePricing: {
            where: { billingPeriod },
          },
        },
      });

      if (!plan || !plan.isActive) {
        throw new NotFoundAppException(
          'Subscription plan not found or inactive',
        );
      }

      const pricing = plan.packagePricing[0];
      if (!pricing) {
        throw new ValidationException(
          'Pricing not available for selected billing period',
        );
      }

      if (!pricing.stripePriceId) {
        throw new ValidationException('Payment configuration incomplete');
      }

      const runningPlan = await this.prisma.userSubscriptionPlan.findFirst({
        where: {
          UserId: userId,
          expiredAt: { gt: new Date() },
        },
      });

      if (runningPlan) {
        throw new ConflictAppException(
          'You already have an active subscription',
        );
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


        console.error(error);
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

    } catch (error) {
      if (
        error instanceof NotFoundAppException ||
        error instanceof ValidationException ||
        error instanceof ConflictAppException
      ) {
        throw error;
      }
      throw new PaymentException('Payment processing failed');
    }
  }

  async upgradePlan(
    userId: string,
    subscriptionPlanId: string,
    billingPeriod: 'MONTHLY' | 'YEARLY',
    user: jwtPayload,
  ) {
    try {
      if (!userId || !subscriptionPlanId) {
        throw new ValidationException('User ID and subscription plan ID are required');
      }

      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: subscriptionPlanId },
        include: {
          packagePricing: {
            where: { billingPeriod },
          },
        },
      });

      if (!plan || !plan.isActive) {
        throw new NotFoundAppException(
          'Subscription plan not found or inactive',
        );
      }

      const pricing = plan.packagePricing[0];
      if (!pricing) {
        throw new ValidationException(
          'Pricing not available for selected billing period',
        );
      }

      if (!pricing.stripePriceId) {
        throw new ValidationException('Payment configuration incomplete');
      }

      // Find existing purchase/history record
      const existingHistory =
        await this.prisma.userSubscriptionPlanHistory.findFirst({
          where: {
            UserId: userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            subscriptionPlanPaymentStatus: true,
          },
        });

      if (!existingHistory) {
        throw new NotFoundAppException(
          'No existing subscription found to upgrade',
        );
      }

      // Update existing history record
      const payment = await this.prisma.userSubscriptionPlanHistory.update({
        where: { id: existingHistory.id },
        data: {
          planName: plan.planName,
          isLimitedInvoicePerMonth: pricing.isLimitedInvoicePerMonth,
          perMonthInvoiceCount: pricing.perMonthInvoiceCount,
          realtimeImapChecking: pricing.invoiceAutoSyncIntervalIds,
          price: pricing.price,
          setupFee: pricing.setupFee,
          freeTrialDays: pricing.freeTrialDays,
          billingPeriod,
          subscriptionPlanPaymentStatus:
            existingHistory.subscriptionPlanPaymentStatus
              ? {
                update: {
                  paymentStatus: 'PENDING',
                  totalAmount: pricing.price + pricing.setupFee,
                  stripeSessionId: null,
                  stripeSubscriptionId: null,
                },
              }
              : {
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
    } catch (error) {
      if (
        error instanceof NotFoundAppException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      throw new PaymentException('Plan upgrade failed');
    }
  }


}
