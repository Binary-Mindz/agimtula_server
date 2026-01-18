/* eslint-disable @typescript-eslint/no-unsafe-return */
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async subscriptionsDashboardGraph(): Promise<
    ReturnType<typeof cResponseData>
  > {
    try {
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
      const monthlyTotalRevenue = {};
      const graphCal = {};
      const totalRevenueGraph = {};

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
      result.reduce((acc, curr) => {
        const { planName, subscriptionPlanPaymentStatus } = curr;
        if (!acc[planName]) {
          acc[planName] = subscriptionPlanPaymentStatus?.totalAmount;
        } else {
          acc[planName] += subscriptionPlanPaymentStatus?.totalAmount;
        }
        return acc;
      }, totalRevenueGraph);

      // subscription plan list
      const subscriptionPlanList = await this.prisma.subscriptionPlan.findMany({
        select: {
          id: true,
          planName: true,
          packagePricing: {
            select: {
              id: true,
              price: true,
              setupFee: true,
              planFeatures: true,
              billingPeriod: true,
            },
          },
        },
      });

      // Monthly Revenue

      const currentDate = new Date();
      // Get the first date of the current month
      const firstDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      ).toISOString();
      // Get the last date of the current month
      const lastDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      ).toISOString();

      const monthlyRevenue =
        await this.prisma.userSubscriptionPlanHistory.findMany({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PAID',
            },
            createdAt: {
              gte: firstDate,
              lte: lastDate,
            },
          },
          select: {
            planName: true,
            subscriptionPlanPaymentStatus: { select: { totalAmount: true } },
          },
        });

      monthlyRevenue.reduce((acc, curr) => {
        const { planName, subscriptionPlanPaymentStatus } = curr;
        if (!acc[planName]) {
          acc[planName] = subscriptionPlanPaymentStatus?.totalAmount;
        } else {
          acc[planName] += subscriptionPlanPaymentStatus?.totalAmount;
        }
        return acc;
      }, monthlyTotalRevenue);

      const subscriptionPlans = subscriptionPlanList.map((plan) => ({
        id:plan.id,
        packagePricing: plan.packagePricing.map((packageItem) => ({
          billingPeriod: packageItem.billingPeriod,
          price: Number((packageItem.price + packageItem.setupFee).toFixed(2)),
        })),
        planFeatures: plan.packagePricing
          .map((packageItem) => packageItem.planFeatures)
          .flat(),
        subscribers: Subscribers[plan.planName] || 0,
        monthlyTotalRevenue: monthlyTotalRevenue[plan.planName] || 0,
      }));

      return cResponseData({
        message: 'Subscription plan dashboard data fetched successfully',
        data: { graphCal, totalRevenueGraph, subscriptionPlans },
      });
    } catch (error) {
      console.error('Subscription dashboard error:', error);
      throw new HttpException(
        'Failed to get subscription dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createSubscription(
    dto: CreateSubscriptionPlanDto,
  ): Promise<ReturnType<typeof cResponseData>> {
    try {

      const subscriptionPlan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          planName:dto.planName
        }
      })
      if (subscriptionPlan) {
        throw new HttpException('Subscription plan already exists', HttpStatus.CONFLICT);
      }
      
      
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
                stripePriceId: `PLACEHOLDER_${Date.now()}_${packageItem.billingPeriod}`,
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } 
      throw new HttpException(
        'Failed to create subscription plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSubscriptionPlans(): Promise<ReturnType<typeof cResponseData>> {
    try {
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
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to get subscription plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSubscriptionPlan(
    id: string,
  ): Promise<ReturnType<typeof cResponseData>> {
    try {
      if (!id) {
        throw new HttpException(
          'Subscription plan ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: {
          id: id,
        },
        include: {
          packagePricing: true,
        },
      });

      if (!plan) {
        throw new HttpException(
          'Subscription plan not found',
          HttpStatus.NOT_FOUND,
        );
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get subscription plan error:', error);
      throw new HttpException(
        'Failed to get subscription plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteSubscription(
    id: string,
  ): Promise<ReturnType<typeof cResponseData>> {
    try {
      if (!id) {
        throw new HttpException(
          'Subscription plan ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existing = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpException(
          'Subscription plan not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const plan = await this.prisma.subscriptionPlan.delete({
        where: { id },
      });

      return cResponseData({
        message: 'Subscription plan deleted successfully',
        data: plan,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Delete subscription error:', error);
      throw new HttpException(
        'Failed to delete subscription plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    try {
      const isSubscription = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
        include: { packagePricing: true }
      });

      if (!isSubscription) {
        throw new HttpException("Subscription not found", HttpStatus.NOT_FOUND);
      }

      // Update subscription plan
      await this.prisma.subscriptionPlan.update({
        where: { id },
        data: {
          planName: dto.planName,
          isActive: dto.isActive,
          description: dto.description,
        },
      });

      // Update package pricing if provided
      if (dto.packagePricingDto && dto.packagePricingDto.length > 0) {
        // Delete existing package pricing
        await this.prisma.packagePricing.deleteMany({
          where: { SubscriptionPlanId: id }
        });

        // Create new package pricing
        await this.prisma.packagePricing.createMany({
          data: dto.packagePricingDto.map((packageItem) => ({
            SubscriptionPlanId: id,
            perMonthInvoiceCount: dto.perMonthInvoiceCount,
            planFeatures: dto.planFeatures,
            invoiceAutoSyncIntervalIds: dto.invoiceAutoSyncIntervalIds,
            price: packageItem.price,
            setupFee: packageItem.setupFee,
            freeTrialDays: packageItem.freeTrialDays,
            billingPeriod: packageItem.billingPeriod,
            stripePriceId: `PLACEHOLDER_${Date.now()}_${packageItem.billingPeriod}`,
          })),
        });
      }

      // Get updated plan with pricing
      const finalPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { id },
        include: { packagePricing: true }
      });

      return cResponseData({
        message: 'Subscription plan updated successfully',
        data: finalPlan,
      });

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Update subscription error:', error);
      throw new HttpException(
        'Failed to update subscription plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
