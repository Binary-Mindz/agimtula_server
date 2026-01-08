import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentStatus } from 'prisma/generated/prisma/enums';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentData() {
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

      return cResponseData({
        message: 'Payment data fetched successfully',
        data: {
          totalRevenue: totalAmount,
          successfulPayments: successfulPayment,
          pendingPayments: pendingPayment,
          failedPayments: failedPayment,
          totalPayments: successfulPayment + pendingPayment + failedPayment,
        },
      });
    } catch (error) {
      console.error('Get payment data error:', error);
      throw new HttpException(
        'Failed to fetch payment data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionsData(
    search: string,
    date: string,
    status: PaymentStatus,
  ) {
    try {
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
        const dateString = date;

        // Parse the date string (format: YYYY-MM-DD)
        // Split to get year, month, day to avoid timezone issues
        const dateParts = dateString.split('-');
        if (dateParts.length === 3) {
          const targetYear = parseInt(dateParts[0], 10);
          const targetMonth = parseInt(dateParts[1], 10) - 1;
          const targetDay = parseInt(dateParts[2], 10);

          // Create start and end of the target day in UTC to match database timezone
          const startOfDay = new Date(
            Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0),
          );
          const endOfDay = new Date(
            Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999),
          );

          query['createdAt'] = {
            gte: startOfDay,
            lte: endOfDay,
          };
        } else {
          // Fallback to original method if format is different
          const targetDate = new Date(dateString);
          const targetDay = targetDate.getUTCDate();
          const targetMonth = targetDate.getUTCMonth();
          const targetYear = targetDate.getUTCFullYear();

          const startOfDay = new Date(
            Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0),
          );
          const endOfDay = new Date(
            Date.UTC(targetYear, targetMonth, targetDay, 23, 59, 59, 999),
          );

          query['createdAt'] = {
            gte: startOfDay,
            lte: endOfDay,
          };
        }
      }

      if (status) {
        query['subscriptionPlanPaymentStatus'] = {
          paymentStatus: status,
        };
      }

      const transactions =
        await this.prisma.userSubscriptionPlanHistory.findMany({
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
        });

      return cResponseData({
        message: 'Transactions are fetched',
        data: transactions,
      });
    } catch (error) {
      console.error('Get transactions data error:', error);
      throw new HttpException(
        'Failed to fetch transactions data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
