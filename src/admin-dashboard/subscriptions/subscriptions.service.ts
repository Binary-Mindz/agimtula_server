/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscriptionsDashboardGraph() {
    const result = await this.prisma.userSubscriptionPlanHistory.findMany({
      where: {
        subscriptionPlanPaymentStatus: {
          paymentStatus: 'PAID',
        },
      },
      select: {
        planName: true,
        subscriptionPlanPaymentStatus: { select: { totalAmount: true } },
      },
    });

    const totalSub = result.length;
    const Subscribers = {};
    const graphCal = {};

    // GraphCal
    result.reduce((acc, curr) => {
      const { planName } = curr;
      if (!acc[planName]) {
        acc[planName] = 1;
      } else {
        acc[planName] += 1;
      }
      return acc;
    }, graphCal);
    for (const key in graphCal) {
      Subscribers[key] = graphCal[key];
      graphCal[key] = Number(((graphCal[key] / totalSub) * 100).toFixed(2));
    }

    // scal graph cal
    const totalRevenue = {};
    result.reduce((acc, curr) => {
      const { planName, subscriptionPlanPaymentStatus } = curr;
      if (!acc[planName]) {
        acc[planName] = subscriptionPlanPaymentStatus?.totalAmount;
      } else {
        acc[planName] += subscriptionPlanPaymentStatus?.totalAmount;
      }
      return acc;
    }, totalRevenue);

    // // subscription plan list
    // const subscriptionPlanList = await this.prisma.subscriptionPlan.findMany({
    //   select: {
    //     id: true,
    //     planName: true,
    //     isActive: true,
    //     packagePricing: {
    //       select: {
    //         id: true,
    //         price: true,
    //         setupFee: true,
    //         freeTrialDays: true,
    //         billingPeriod: true,
    //       },
    //     },
    //   },
    // });

    return cResponseData({
      message: 'Subscription plan purchased successfully',
      data: { Subscribers, graphCal, totalRevenue },
    });
  }

  async createSubscription(dto: CreateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        planName: dto.planName,
        isActive: dto.isActive,
        description: dto.description,
        packagePricing: {
          createMany: {
            data: dto.packagePricingDto.map((packageItem) => ({
              perMonthInvoiceCount: dto.perMonthInvoiceCount,
              planFeatures: dto.planFeatures,
              invoiceAutoSyncIntervalIds: dto.invoiceAutoSyncIntervalIds,

              price: packageItem.price,
              setupFee: packageItem.setupFee,
              freeTrialDays: packageItem.freeTrialDays,

              billingPeriod: packageItem.billingPeriod,
            })),
          },
        },
      },
      include: {
        packagePricing: true,
      },
    });

    return cResponseData({
      message: 'Subscription plan created successfully',
      data: plan,
    });
  }

  async getSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: {
        packagePricing: {
          select: { id: true },
        },
      },
    });

    // important part to get invoice auto-sync intervals related to plans
    const packagePricing = await this.prisma.packagePricing.findMany();

    const invoiceIds = packagePricing
      .map((plan) => plan.invoiceAutoSyncIntervalIds)
      .flat();

    const intervals = await this.prisma.invoiceAutoSyncInterval.findMany({
      where: {
        id: {
          in: invoiceIds || [],
        },
      },
      distinct: ['id'],
    });
    const intervalsObject = new Map<string, any>(
      intervals.map((interval) => [interval.id, interval]),
    );

    // set PackagePricing to InvoiceAutoSyncInterval
    const setPackagePricingInvoiceAutoSyncInterval = new Map<string, any>(
      packagePricing.map((plan) => [
        plan.id,
        {
          id: plan.id,
          isLimitedInvoicePerMonth: plan.isLimitedInvoicePerMonth,
          perMonthInvoiceCount: plan.perMonthInvoiceCount,
          planFeatures: plan.planFeatures,
          price: plan.price,
          setupFee: plan.setupFee,
          freeTrialDays: plan.freeTrialDays,
          billingPeriod: plan.billingPeriod,
          SubscriptionPlanId: plan.SubscriptionPlanId,
          invoiceAutoSyncIntervals: plan.invoiceAutoSyncIntervalIds.map(
            (iASI) => intervalsObject.get(iASI),
          ),
        },
      ]),
    );

    return cResponseData({
      data: plans.map((plans) => ({
        ...plans,
        packagePricing: plans.packagePricing.map((pp) =>
          setPackagePricingInvoiceAutoSyncInterval.get(pp.id),
        ),
      })),
    });
  }

  async getSubscriptionPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: {
        id: id,
      },
      include: {
        packagePricing: true,
      },
    });

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const interval = await this.prisma.invoiceAutoSyncInterval.findMany({
      where: {
        id: {
          in: plan.packagePricing.flatMap(
            (pricing) => pricing.invoiceAutoSyncIntervalIds,
          ),
        },
      },
    });

    return cResponseData({
      message: 'Subscription plan retrieved successfully',
      data: {
        id: plan.id,
        planName: plan.planName,
        isActive: plan.isActive,
        description: plan.description,
        packagePricing: plan.packagePricing,
        invoiceAutoSyncIntervals: interval,
      },
    });
  }

  async deleteSubscription(id: string) {
    const plan = await this.prisma.subscriptionPlan.delete({
      where: {
        id: id,
      },
    });

    return plan;
  }

  updateSubscription(id: string, dto: any) {
    return { id, dto };
  }

  getSubscriptionData() {}
}
