import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReportData(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

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
           
            createdAt: { gte: sixMonthsAgo },
          },
          select: { totalAmount: true, createdAt: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
          
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            isPaid: true,
          
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.invoice.aggregate({
          where: {
            userId,
            invoiceSource: 'MANUAL',
            isPaid: false,
          
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
        success: true,
        message: 'Reports data retrieved successfully',
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
    } catch (error) {
      console.error('Get report data error:', error);
      throw new HttpException(
        'Failed to retrieve reports data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async exportIncomeData(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

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
        success: true,
        message: 'Income data exported successfully',
        data: invoices,
      });
    } catch (error) {
      console.error('Export income data error:', error);
      throw new HttpException(
        'Failed to export income data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFinancialSummary(userId: string) {
    try {
      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      const [
        receiptStats,
        mileageStats,
        transactionStats,
        recentReceipts,
        recentMileages,
      ] = await Promise.all([
        // Receipt statistics
        this.prisma.receipt.aggregate({
          where: { userId, date: { gte: yearStart } },
          _sum: { amount: true },
          _count: true,
        }),
        
        // Mileage statistics
        this.prisma.mileage.aggregate({
          where: { userId, date: { gte: yearStart } },
          _sum: { amount: true, distance: true },
          _count: true,
        }),
        
        // Transaction statistics (if available)
        this.prisma.transaction.aggregate({
          where: { userId, createdAt: { gte: yearStart } },
          _sum: { amount: true },
          _count: true,
        }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
        
        // Recent receipts
        this.prisma.receipt.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            vendor: true,
            amount: true,
            date: true,
            category: { select: { name: true } },
            createdAt: true,
          }
        }),
        
        // Recent mileages
        this.prisma.mileage.findMany({
          where: { userId },
          orderBy: { date: 'desc' },
          take: 5,
          select: {
            id: true,
            name: true,
            distance: true,
            amount: true,
            date: true,
            createdAt: true,
          }
        }),
      ]);

      // Calculate totals without invoice data
      const receiptExpenses = receiptStats._sum.amount || 0;
      const mileageExpenses = mileageStats._sum.amount || 0;
      const totalExpenses = receiptExpenses + mileageExpenses;
      
      return cResponseData({
        success: true,
        message: 'Financial summary retrieved successfully',
        data: {
          overview: {
            totalExpenses,
            receiptExpenses,
            mileageExpenses,
          },
          
          travelAndReimbursements: {
            totalMileage: mileageStats._sum.distance || 0,
            mileageAmount: mileageStats._sum.amount || 0,
            tripCount: mileageStats._count,
            averagePerTrip: mileageStats._count > 0 
              ? ((mileageStats._sum.amount || 0) / mileageStats._count).toFixed(2) 
              : '0.00'
          },
          
          receiptExpenses: {
            totalAmount: receiptStats._sum.amount || 0,
            receiptCount: receiptStats._count,
            averagePerReceipt: receiptStats._count > 0 
              ? ((receiptStats._sum.amount || 0) / receiptStats._count).toFixed(2) 
              : '0.00',
          },
          
          recentActivity: {
            receipts: recentReceipts,
            mileages: recentMileages
          },
          
          summary: {
            totalTransactions: receiptStats._count + mileageStats._count + (transactionStats._count || 0),
            dataRange: `${yearStart.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
            lastUpdated: new Date().toISOString()
          }
        }
      });
      
    } catch (error) {
      console.error('Get financial summary error:', error);
      throw new HttpException(
        'Failed to retrieve financial summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
