import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getData(): Promise<ReturnType<typeof cResponseData>> {
    try {
      const firstDayOfThisMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const lastDayOfThisMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
      );
  

      const lastSixMonths = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const [
        userCount,
        subscriptionAmountThisMonth,
        pendingPaymentCount,
        activeSubscriptionsCount,
        lastSixMonthsData,
        lastSixMonthsUsers,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
            isDeleted: false,
          },
        }),

        this.prisma.userSubscriptionPlanHistory.findMany({
          where: {
            createdAt: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
          select: {
            subscriptionPlanPaymentStatus: {
              select: {
                totalAmount: true,
                paymentStatus: true,
              },
            },
          },
        }),

        this.prisma.userSubscriptionPlanHistory.count({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PENDING',
            },
          },
        }),

        this.prisma.userSubscriptionPlan.count({
          where: {
            isActive: true,
            expiredAt: {
              gt: new Date(),
            },
          },
        }),

        this.prisma.userSubscriptionPlanHistory.findMany({
          where: {
            createdAt: {
              gte: lastSixMonths,
            },
          },
          select: {
            subscriptionPlanPaymentStatus: {
              select: {
                totalAmount: true,
                paymentStatus: true,
                createdAt: true,
              },
            },
          },
        }),
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
      ]);

      let subscriptionAmount = 0;

      subscriptionAmountThisMonth.forEach((item) => {
        if (item.subscriptionPlanPaymentStatus?.paymentStatus === 'PAID') {
          subscriptionAmount +=
            item.subscriptionPlanPaymentStatus?.totalAmount || 0;
        }
      });

      const monthlyData: { month: string; amount: number }[] = [];

      lastSixMonthsData.forEach((item) => {
        if (item.subscriptionPlanPaymentStatus?.paymentStatus === 'PAID') {
          const month =
            item.subscriptionPlanPaymentStatus?.createdAt.getMonth() + 1;
          const year =
            item.subscriptionPlanPaymentStatus?.createdAt.getFullYear();
          const monthYear = `${year}-${month}`;
          const amount = item.subscriptionPlanPaymentStatus?.totalAmount || 0;

          const existingMonth = monthlyData.find((m) => m.month === monthYear);

          if (existingMonth) {
            existingMonth.amount += amount;
          } else {
            monthlyData.push({ month: monthYear, amount });
          }
        }
      });

      const firstHalfData: { month: string; userCount: number }[] = [];
      const secondHalfData: { month: string; userCount: number }[] = [];

      lastSixMonthsUsers.forEach((item) => {
        const date = new Date(item.created_at);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const monthYear = `${year}-${month}`;

        if (day <= 15) {
          const existing = firstHalfData.find((m) => m.month === monthYear);
          if (existing) {
            existing.userCount += 1;
          } else {
            firstHalfData.push({ month: monthYear, userCount: 1 });
          }
        } else {
          const existing = secondHalfData.find((m) => m.month === monthYear);
          if (existing) {
            existing.userCount += 1;
          } else {
            secondHalfData.push({ month: monthYear, userCount: 1 });
          }
        }
      });

      const monthlyTotalUser = firstHalfData;
      const thisMonthTotalActiveUser = secondHalfData;

      return cResponseData({
        data: {
          userCount,
          subscriptionAmount,
          pendingPaymentCount: pendingPaymentCount || 0,
          activeSubscriptionsCount,
          revenueTrend: monthlyData,
          monthlyTotalUser,
          thisMonthTotalActiveUser,
        },
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
      throw new HttpException(
        'Failed to fetch dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRecentActivities(
    limit = 5,
  ): Promise<ReturnType<typeof cResponseData>> {
    try {
      const activities = await this.prisma.activityLog.findMany({
        where: {
          category: { in: ['USER', 'SYSTEM'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const formattedActivities = activities.map((activity) => ({
        userName: activity.userName || 'Someone',
        description: activity.title,
        timeAgo: formatDistanceToNow(new Date(activity.createdAt ), {
          addSuffix: true,
        }),
        amount: activity.amount,
        currency: activity.currency,
      }));

      return cResponseData({
        success: true,
        message: 'Recent activities fetched successfully',
        data: formattedActivities,
      });
    } catch (error) {
      console.error('Get recent activities error:', error);
      throw new HttpException(
        'Failed to fetch recent activities',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
