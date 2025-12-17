/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Injectable } from '@nestjs/common';
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
        perMonthInvoiceCount: dto.perMonthInvoiceCount,
        planFeatures: dto.planFeatures,
        packagePricing: {
          createMany: {
            data: dto.packagePricingDto.map((packageItem) => ({
              price: packageItem.price,
              setupFee: packageItem.setupFee,
              freeTrialDays: packageItem.freeTrialDays,
              billingPeriod: packageItem.billingPeriod,
            })),
          },
        },
        invoiceAutoSyncIntervalIds: dto.invoiceAutoSyncIntervalIds,
      },
      include: {
        packagePricing: true,
      },
    });

    return { plan, message: 'Subscription plan created successfully' };
  }

  async getSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        planName: true,
        isActive: true,
        description: true,
        perMonthInvoiceCount: true,
        planFeatures: true,
        invoiceAutoSyncIntervalIds: true,
        packagePricing: true,
      },
    });

    // important part to get invoice auto-sync intervals related to plans
    const intervals = await this.prisma.invoiceAutoSyncInterval.findMany({
      where: {
        id: {
          in: plans.flatMap((plan) => plan.invoiceAutoSyncIntervalIds || []),
        },
      },
      distinct: ['id'],
    });
    const intervalsObject = new Map<string, any>(
      intervals.map((interval) => [interval.id, interval]),
    );

    return {
      planing: plans.map((plan) => ({
        id: plan.id,
        planName: plan.planName,
        isActive: plan.isActive,
        description: plan.description,
        perMonthInvoiceCount: plan.perMonthInvoiceCount,
        planFeatures: plan.planFeatures,
        packagePricing: plan.packagePricing,
        invoiceAutoSyncIntervals: plan.invoiceAutoSyncIntervalIds?.map(
          (intervalId: string) => intervalsObject.get(intervalId),
        ),
      })),
      message: 'Subscription plans retrieved successfully',
    };
  }

  // async getSubscriptionManagementData() {
  //   const subscriberCount = await this.prisma.subscriptionPlan.count({
  //     where: {

  //     }
  //   });
  // }

  async deleteSubscription(id: string) {
    const plan = await this.prisma.subscriptionPlan.delete({
      where: {
        id: id,
      },
    });

    return { plan, message: 'Subscription plan deleted successfully' };
  }

  updateSubscription(id: string, dto: any) {
    return { id, dto };
  }
}
