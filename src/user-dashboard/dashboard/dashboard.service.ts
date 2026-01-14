import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboardData(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const now = new Date();
      const startDateOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endDateOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        lastMonthsTotalInvoices,
        thisMonthsTotalInvoices,
        pendingInvoicesTotal,
        perdingInvoicesCount,
        mileageExpenseFromLastMonths,
        totalMileage,
        mileageExpenseThisMonths,
        lastMonthsReceiptExpense,
        thisMonthsReceiptExpense,
      ] = await Promise.all([
        this.prisma.invoice.count({
          where: {
            userId,
            dueDate: {
              lt: new Date(),
            },
            createdAt: {
              lte: endDateOfLastMonth,
              gte: startDateOfLastMonth,
            },
          },
        }),
        this.prisma.invoice.count({
          where: {
            userId,
            dueDate: {
              lt: new Date(),
            },
            createdAt: {
              lte: now,
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
        }),
        this.prisma.invoice.aggregate({
          where: {
            userId,
            isPaid: false,
            dueDate: {
              lt: new Date(),
            },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.count({
          where: {
            userId,
            isPaid: false,
            dueDate: {
              lt: new Date(),
            },
          },
        }),
        this.prisma.mileage.aggregate({
          where: {
            userId,
            createdAt: {
              lte: endDateOfLastMonth,
              gte: startDateOfLastMonth,
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.mileage.aggregate({
          where: {
            userId,
          },
          _sum: {
            distance: true,
          },
        }),
        this.prisma.mileage.aggregate({
          where: {
            userId,
            createdAt: {
              lte: now,
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.receipt.aggregate({
          where: {
            userId,
            createdAt: {
              lte: endDateOfLastMonth,
              gte: startDateOfLastMonth,
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.receipt.aggregate({
          where: {
            userId,
            createdAt: {
              lte: now,
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const invoiceComparedToLastMonth = Math.round(
        (thisMonthsTotalInvoices / lastMonthsTotalInvoices) * 100,
      );

      const mileageRegenueThanLastMonths =
        (mileageExpenseThisMonths._sum.amount || 0) -
          (mileageExpenseFromLastMonths._sum.amount || 0) || 0;

      const lastMonthsReceiptExpenseTotal =
        lastMonthsReceiptExpense._sum.amount || 0;
      const lastMonthMileageExpenseTotal =
        mileageExpenseFromLastMonths._sum.amount || 0;

      const lastMonthsTotalExpense =
        lastMonthMileageExpenseTotal + lastMonthsReceiptExpenseTotal;

      const expenseComparedToLastMonth =
        Math.round(
          (thisMonthsReceiptExpense._sum.amount || 0) +
            (mileageExpenseThisMonths._sum.amount || 0) -
            (lastMonthsReceiptExpenseTotal + lastMonthMileageExpenseTotal),
        ) || 0;

      return cResponseData({
        success: true,
        message: 'Dashboard data fetched successfully',
        data: {
          thisMonthsTotalInvoices,
          invoiceComparedToLastMonth,
          pendingInvoicesTotal: pendingInvoicesTotal._sum.totalAmount || 0,
          perdingInvoicesCount,
          totalMileage: totalMileage._sum.distance,
          mileageRegenueThanLastMonths,
          expenseComparedToLastMonth,
          lastMonthsTotalExpense,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Dashboard data error:', error);
      throw new HttpException(
        'Failed to fetch dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
