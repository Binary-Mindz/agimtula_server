import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class ReportsAndAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async userActivity() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          created_at: true,
        },
      });

      // month-wise grouping
      const monthWiseData = users.reduce(
        (acc, user) => {
          const date = new Date(user.created_at);
          const month = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}`;

          if (!acc[month]) {
            acc[month] = 0;
          }

          acc[month] += 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // object → array (chart friendly)
      const result = Object.keys(monthWiseData)
        .sort()
        .map((month) => ({
          month,
          total: monthWiseData[month],
        }));

      return cResponseData({
        data: result,
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
      const totalUsers = await this.prisma.user.findMany({
        where: {},
      });
      return cResponseData({
        data: {
          totalUsers: totalUsers,
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
