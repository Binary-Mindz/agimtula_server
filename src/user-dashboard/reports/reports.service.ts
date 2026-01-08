import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReportData(userId: string) {
    try {
      const sixMonthsAgo = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const [
        invoices,
        totalIncome,
        totalPaid,
        totalPending,
        totalReceipt,
        totalMileage,
        receipt,
        mileage,
      ] = await Promise.all([
        this.prisma.invoice.findMany({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            dueDate: {
              lt: new Date(),
            },
            createdAt: { gte: sixMonthsAgo },
          },
          select: { totalAmount: true, createdAt: true },
        }),

        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            dueDate: {
              lt: new Date(),
            },
          },
          _sum: { totalAmount: true },
        }),

        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            isPaid: true,
            dueDate: {
              lt: new Date(),
            },
          },
          _sum: { totalAmount: true },
        }),

        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            isPaid: false,
            dueDate: {
              lt: new Date(),
            },
          },
          _sum: { totalAmount: true },
        }),

        this.prisma.receipt.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        this.prisma.mileage.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        this.prisma.receipt.findMany({
          where: { userId, date: { gte: sixMonthsAgo } },
          select: { amount: true, date: true },
        }),
        this.prisma.mileage.findMany({
          where: {
            userId,
            date: { gte: sixMonthsAgo },
          },
          select: { amount: true, date: true },
        }),
      ]);

      const incomeMonthlySummury: { month: string; total: number }[] = [];

      invoices.forEach((invoice) => {
        const year = invoice.createdAt.getFullYear();
        const month = invoice.createdAt.getMonth() + 1;
        const monthYear = `${year}-${month}`;

        const existingEntry = incomeMonthlySummury.find(
          (entry) => entry.month === monthYear,
        );

        if (existingEntry) {
          existingEntry.total += invoice.totalAmount;
        } else {
          incomeMonthlySummury.push({
            month: monthYear,
            total: invoice.totalAmount,
          });
        }
      });

      const expenseAll = [...receipt, ...mileage];

      const expressMonthlySummary: { month: string; total: number }[] = [];

      for (const item of expenseAll) {
        const year = item.date.getFullYear();
        const month = item.date.getMonth() + 1;
        const monthYear = `${year}-${month}`;

        const existingEntry = expressMonthlySummary.find(
          (entry) => entry.month === monthYear,
        );

        if (existingEntry) {
          existingEntry.total += item.amount;
        } else {
          expressMonthlySummary.push({
            month: monthYear,
            total: item.amount,
          });
        }
      }

      return cResponseData({
        message: 'Retrived reports data',
        data: {
          totalIncome: totalIncome._sum.totalAmount || 0,
          totalPaid: totalPaid._sum.totalAmount || 0,
          totalPending: totalPending._sum.totalAmount || 0,

          totalExpense:
            (totalReceipt._sum.amount || 0) + (totalMileage._sum.amount || 0) ||
            0,
          totalReceipt: totalReceipt._sum.amount || 0,
          totalMileage: totalMileage._sum.amount || 0,

          incomeMonthlySummury,
          expressMonthlySummary,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to retrive reports data',
        error: 'Failed to retrive reports data',
      });
    }
  }

  async exportIncomeData(userId: string) {
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          userId,
          invoiceSource: 'MANUAL',
        },
        select: {
          invoiceNo: true,
          companyName: true,
          dueDate: true,
          totalAmount: true,
          isPaid: true,
          createdAt: true,
        },
      });

      return cResponseData({
        message: 'Income data exported successfully',
        success: true,
        data: invoices,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to export income data',
        success: false,
      });
    }
  }

  async exportExpenseData(userId: string) {
    try {
      const receipts = await this.prisma.receipt.findMany({
        where: { userId },
      });

      const mileages = await this.prisma.mileage.findMany({
        where: { userId },
      });

      const expenseAll = [...receipts, ...mileages];

      return cResponseData({
        message: 'Expense data exported successfully',
        success: true,
        data: expenseAll,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return cResponseData({
        message: 'Failed to export expense data',
        success: false,
      });
    }
  }
}
