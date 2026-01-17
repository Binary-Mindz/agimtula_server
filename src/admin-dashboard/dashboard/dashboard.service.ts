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

      const lastMonthsFirstDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1,
      );
      const lastMonthsLastDate = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        0,
      );

      const lastSixMonths = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const [
        previousMonthsUser,
        thisMonthsUser,
        userCount,
        subscriptionAmountThisMonth,
        subscriptionAmountLastMonth,
        pendingPaymentCount,
        activeSubscriptionsCount,
        activeSubscriptionsLastMonth,
        lastSixMonthsData,
        lastSixMonthsUsers,
        activeUsers,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
            isDeleted: false,
            created_at: {
              gte: lastMonthsFirstDate,
              lte: lastMonthsLastDate,
            },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
            isDeleted: false,
            created_at: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
        }),

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

        this.prisma.userSubscriptionPlanHistory.findMany({
          where: {
            createdAt: {
              gte: lastMonthsFirstDate,
              lte: lastMonthsLastDate,
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

        this.prisma.userSubscriptionPlan.count({
          where: {
            isActive: true,
            expiredAt: {
              gte: lastMonthsFirstDate,
              lte: lastMonthsLastDate,
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

      let subscriptionAmount = 0;
      let lastMonthSubscriptionAmount = 0;

      subscriptionAmountThisMonth.forEach((item) => {
        if (item.subscriptionPlanPaymentStatus?.paymentStatus === 'PAID') {
          subscriptionAmount +=
            item.subscriptionPlanPaymentStatus?.totalAmount || 0;
        }
      });

      subscriptionAmountLastMonth.forEach((item) => {
        if (item.subscriptionPlanPaymentStatus?.paymentStatus === 'PAID') {
          lastMonthSubscriptionAmount +=
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

      const userMonthlyData: {
        month: string;
        userCount: number;
      }[] = [];

      lastSixMonthsUsers.forEach((item) => {
        const month = item.created_at.getMonth() + 1;
        const year = item.created_at.getFullYear();
        const monthYear = `${year}-${month}`;

        const existingMonth = userMonthlyData.find(
          (m) => m.month === monthYear,
        );

        if (existingMonth) {
          existingMonth.userCount += 1;
        } else {
          userMonthlyData.push({ month: monthYear, userCount: 1 });
        }
      });

      const activeUsersMonthlyData: {
        month: string;
        activeUserCount: number;
      }[] = [];

      activeUsers.forEach((item) => {
        const month = item.created_at.getMonth() + 1;
        const year = item.created_at.getFullYear();
        const monthYear = `${year}-${month}`;

        const existingMonth = activeUsersMonthlyData.find(
          (m) => m.month === monthYear,
        );

        if (existingMonth) {
          existingMonth.activeUserCount += 1;
        } else {
          activeUsersMonthlyData.push({
            month: monthYear,
            activeUserCount: 1,
          });
        }
      });

      const userGrowthPercentage = previousMonthsUser > 0
        ? Math.round(((thisMonthsUser - previousMonthsUser) / previousMonthsUser) * 100)
        : thisMonthsUser > 0 ? 100 : 0;

      const revenueGrowthPercentage = lastMonthSubscriptionAmount > 0
        ? Math.round(((subscriptionAmount - lastMonthSubscriptionAmount) / lastMonthSubscriptionAmount) * 100)
        : subscriptionAmount > 0 ? 100 : 0;

      const subscriptionGrowthPercentage = activeSubscriptionsLastMonth > 0
        ? Math.round(((activeSubscriptionsCount - activeSubscriptionsLastMonth) / activeSubscriptionsLastMonth) * 100)
        : activeSubscriptionsCount > 0 ? 100 : 0;

      return cResponseData({
        data: {
          userCount,
          userGrowthPercentage,
          subscriptionAmount,
          revenueGrowthPercentage,
          pendingPaymentCount: pendingPaymentCount || 0,
          activeSubscriptionsCount,
          subscriptionGrowthPercentage,
          revenueTrend: monthlyData,
          monthlyTotalUser: userMonthlyData,
          thisMonthTotalActiveUser: activeUsersMonthlyData,
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
          category: 'ADMIN',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const formattedActivities = activities.map((activity) => ({
        userName: activity.userName || 'Someone',
        description: activity.title,
        timeAgo: formatDistanceToNow(new Date(activity.createdAt as Date), {
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
