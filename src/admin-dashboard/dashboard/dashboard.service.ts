import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getData() {
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
        lastSixMonthsData,
        lastSixMonthsUsers,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
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

      return cResponseData({
        data: {
          userCount,
          subscriptionAmount,
          pendingPaymentCount: pendingPaymentCount || 0,
          monthlyData,
          userMonthlyData,
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
}
