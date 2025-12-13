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
        realtimeImapChecking: dto.realtimeImapChecking,
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
      },
      include: {
        packagePricing: true,
      },
    });

    return { plan, message: 'Subscription plan created successfully' };
  }

  async getSubscriptionPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: {
        packagePricing: true,
      },
    });

    return { plans, message: 'Subscription plans retrieved successfully' };
  }

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
