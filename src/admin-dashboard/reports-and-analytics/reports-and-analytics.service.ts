import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class ReportsAndAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async userActivity() {
    try {
      const lastSixMonths = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const [lastSixMonthsUsers, lastSixMonthsActiveUsers] = await Promise.all([
        this.prisma.user.findMany({
          where: {
            created_at: {
              gte: lastSixMonths,
            },
            role: 'USER',
            isDeleted: false,
          },
          select: { created_at: true },
        }),
        this.prisma.user.findMany({
          where: {
            created_at: {
              gte: lastSixMonths,
            },
            isDeleted: false,
            role: 'USER',
            status: true,
          },
          select: { created_at: true },
        }),
      ]);

      const userActivity: {
        month: string;
        totalUsers: number;
        activeUsers: number;
      }[] = [];

      // Process total users
      lastSixMonthsUsers.forEach((item) => {
        const month = item.created_at.getMonth() + 1;
        const year = item.created_at.getFullYear();
        const monthYear = `${year}-${month}`;

        const existingMonth = userActivity.find((m) => m.month === monthYear);

        if (existingMonth) {
          existingMonth.totalUsers += 1;
        } else {
          userActivity.push({
            month: monthYear,
            totalUsers: 1,
            activeUsers: 0,
          });
        }
      });

      // Process active users
      lastSixMonthsActiveUsers.forEach((item) => {
        const month = item.created_at.getMonth() + 1;
        const year = item.created_at.getFullYear();
        const monthYear = `${year}-${month}`;

        const existingMonth = userActivity.find((m) => m.month === monthYear);

        if (existingMonth) {
          existingMonth.activeUsers += 1;
        } else {
          userActivity.push({
            month: monthYear,
            totalUsers: 0,
            activeUsers: 1,
          });
        }
      });

      return cResponseData({
        data: userActivity,
      });
    } catch (error) {
      console.error('User activity error:', error);
      throw new HttpException(
        'Failed to fetch user activity data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revenueGrowth() {
    try {
      const subscriptions =
        await this.prisma.userSubscriptionPlanHistory.findMany({
          select: {
            price: true,
            createdAt: true,
          },
        });

      const monthWiseRevenue = subscriptions.reduce(
        (acc, item) => {
          const date = new Date(item.createdAt);
          const month = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}`;

          if (!acc[month]) {
            acc[month] = 0;
          }

          acc[month] += item.price;
          return acc;
        },
        {} as Record<string, number>,
      );

      const result = Object.keys(monthWiseRevenue)
        .sort()
        .map((month) => ({
          month,
          totalPrice: monthWiseRevenue[month],
        }));

      return cResponseData({
        data: result,
      });
    } catch (error) {
      console.error('Revenue growth error:', error);
      throw new HttpException(
        'Failed to fetch revenue growth data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async subscriptionTrends() {
    try {
      const subscriptions =
        await this.prisma.userSubscriptionPlanHistory.findMany({
          select: {
            planName: true,
            price: true,
          },
        });
      const income = subscriptions.reduce(
        (acc, item) => {
          if (!acc[item.planName]) {
            acc[item.planName] = 0;
          }
          acc[item.planName] += item.price;
          return acc;
        },
        {} as Record<string, number>,
      );

      return cResponseData({
        data: income,
      });
    } catch (error) {
      console.error('Subscription trends error:', error);
      throw new HttpException(
        'Failed to fetch subscription trends data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async platformHealth() {
    try {
      const now = new Date();

      // Get all users with role USER
      const [
        totalUsers,
        activeUsers,
        usersWithActiveSubscriptions,
        usersWithRenewedSubscriptions,
        totalPayments,
        successfulPayments,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: 'USER',
            isDeleted: false,
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
            isDeleted: false,
          },
        }),
        this.prisma.userSubscriptionPlan.count({
          where: {
            isActive: true,
            expiredAt: {
              gt: now,
            },
            user: {
              role: 'USER',
              isDeleted: false,
            },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'USER',
            isDeleted: false,
            userSubscriptionPlanHistory: {
              some: {},
            },
          },
        }),
        this.prisma.subscriptionPlanPaymentStatus.count({}),
        this.prisma.subscriptionPlanPaymentStatus.count({
          where: {
            paymentStatus: 'PAID',
          },
        }),
      ]);

      // Calculate percentages
      const activeUsersPercentage =
        totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Subscription Retention 1: Active subscriptions out of total users
      const subscriptionRetentionPercentage =
        totalUsers > 0 ? (usersWithActiveSubscriptions / totalUsers) * 100 : 0;

      // Subscription Retention 2: Active subscriptions out of users who have ever subscribed
      const subscriptionRetentionFromSubscribers =
        usersWithRenewedSubscriptions > 0
          ? (usersWithActiveSubscriptions / usersWithRenewedSubscriptions) * 100
          : 0;

      const paymentSuccessRate =
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      return cResponseData({
        data: {
          activeUsers: Number(activeUsersPercentage.toFixed(2)),
          subscriptionRetention: Number(
            subscriptionRetentionPercentage.toFixed(2),
          ),
          subscriptionRetentionFromSubscribers: Number(
            subscriptionRetentionFromSubscribers.toFixed(2),
          ),
          paymentSuccessRate: Number(paymentSuccessRate.toFixed(2)),
        },
      });
    } catch (error) {
      console.error('Platform health error:', error);
      throw new HttpException(
        'Failed to fetch platform health data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
