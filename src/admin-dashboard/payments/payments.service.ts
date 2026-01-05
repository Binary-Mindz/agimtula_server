import { Injectable } from '@nestjs/common';
import { PaymentStatus } from 'prisma/generated/prisma/enums';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentData() {
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

    const [totalRevenue, successfulPayment, pendingPayment, failedPayment] =
      await Promise.all([
        // Total revenue from history with paid status
        this.prisma.userSubscriptionPlanHistory.aggregate({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PAID',
            },
            createdAt: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
          _sum: {
            price: true,
            setupFee: true,
          },
        }),
        // Count of successful payments from history
        this.prisma.userSubscriptionPlanHistory.count({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PAID',
            },
            createdAt: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
        }),
        // Count of pending payments from history
        this.prisma.userSubscriptionPlanHistory.count({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'PENDING',
            },
            createdAt: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
        }),
        // Count of failed payments from history
        this.prisma.userSubscriptionPlanHistory.count({
          where: {
            subscriptionPlanPaymentStatus: {
              paymentStatus: 'FAILED',
            },
            createdAt: {
              gte: firstDayOfThisMonth,
              lte: lastDayOfThisMonth,
            },
          },
        }),
      ]);

    const totalAmount =
      (totalRevenue._sum.price || 0) + (totalRevenue._sum.setupFee || 0);

    return {
      totalRevenue: totalAmount,
      successfulPayments: successfulPayment,
      pendingPayments: pendingPayment,
      failedPayments: failedPayment,
      totalPayments: successfulPayment + pendingPayment + failedPayment,
    };
  }

  async getTransactionsData(
    search: string,
    date: string,
    status: PaymentStatus,
  ) {
    const query = {};

    if (search) {
      query['OR'] = [
        {
          planName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          id: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            profile: {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            profile: {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      query['createdAt'] = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (status) {
      query['subscriptionPlanPaymentStatus'] = {
        paymentStatus: status,
      };
    }

    const transactions = await this.prisma.userSubscriptionPlanHistory.findMany(
      {
        where: query,
        include: {
          user: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              email: {
                select: {
                  email: true,
                },
              },
            },
          },
          subscriptionPlanPaymentStatus: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    );

    return transactions;
  }
}
