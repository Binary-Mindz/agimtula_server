/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

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
        packagePricing: true,
      },
    });

    const invoiceIds = plans
      .map((plan) =>
        plan.packagePricing.flatMap(
          (pricing) => pricing.invoiceAutoSyncIntervalIds,
        ),
      )
      .flat();

    // important part to get invoice auto-sync intervals related to plans
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

    return cResponseData({
      data: plans.map((plan) => ({
        id: plan.id,
        planName: plan.planName,
        isActive: plan.isActive,
        description: plan.description,
        packagePricing: plan.packagePricing,
        invoiceAutoSyncIntervals: invoiceIds?.map((intervalId: string) =>
          intervalsObject.get(intervalId),
        ),
      })),
    });
  }

  // async getSubscriptionManagementData() {
  //   const subscriberCount = await this.prisma.subscriptionPlan.count({
  //     where: {

  //     }
  //   });
  // }

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
}
