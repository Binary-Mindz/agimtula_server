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
        manualInvoiceStats,
        emailInvoiceStats,
        receiptStats,
        mileageStats,
        transactionStats,
        recentInvoices,
        recentReceipts,
        recentMileages,
        manualVatSummary,
        emailVatSummary
      ] = await Promise.all([
        // Manual Invoice statistics (INCOME)
        this.prisma.invoice.aggregate({
          where: { userId, invoiceSource: 'MANUAL', createdAt: { gte: yearStart } },
          _sum: { totalAmount: true, vat: true, subTotal: true },
          _count: true,
        }),
        
        // Email Invoice statistics (EXPENSE)
        this.prisma.invoice.aggregate({
          where: { userId, invoiceSource: 'EMAIL', createdAt: { gte: yearStart } },
          _sum: { totalAmount: true, vat: true, subTotal: true },
          _count: true,
        }),
        
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
        
        // Recent invoices
        this.prisma.invoice.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            invoiceNo: true,
            companyName: true,
            totalAmount: true,
            isPaid: true,
            createdAt: true,
            invoiceSource: true
          }
        }),
        
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
        
        // VAT summary for manual invoices (INCOME)
        this.prisma.invoice.groupBy({
          by: ['isPaid'],
          where: { userId, invoiceSource: 'MANUAL', createdAt: { gte: yearStart } },
          _sum: { vat: true, totalAmount: true }
        }),
        
        // VAT summary for email invoices (EXPENSE)
        this.prisma.invoice.groupBy({
          by: ['isPaid'],
          where: { userId, invoiceSource: 'EMAIL', createdAt: { gte: yearStart } },
          _sum: { vat: true, totalAmount: true }
        })
      ]);

      // Calculate totals with proper classification
      const totalIncome = manualInvoiceStats._sum.totalAmount || 0; // Manual invoices = Income
      const emailExpenses = emailInvoiceStats._sum.totalAmount || 0; // Email invoices = Expense
      const receiptExpenses = receiptStats._sum.amount || 0;
      const mileageExpenses = mileageStats._sum.amount || 0;
      const totalExpenses = emailExpenses + receiptExpenses + mileageExpenses;
      
      const totalVAT = (manualInvoiceStats._sum.vat || 0) + (emailInvoiceStats._sum.vat || 0);
      const netIncome = totalIncome - totalExpenses;
      
      // Separate paid vs unpaid for manual invoices (income)
      const paidIncome = manualVatSummary.find(v => v.isPaid)?._sum.totalAmount || 0;
      const unpaidIncome = manualVatSummary.find(v => !v.isPaid)?._sum.totalAmount || 0;
      
      // Email invoice expenses
      const paidEmailExpenses = emailVatSummary.find(v => v.isPaid)?._sum.totalAmount || 0;
      const unpaidEmailExpenses = emailVatSummary.find(v => !v.isPaid)?._sum.totalAmount || 0;

      return cResponseData({
        success: true,
        message: 'Financial summary retrieved successfully',
        data: {
          overview: {
            totalIncome,
            totalExpenses,
            netIncome,
            profitMargin: totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(2) : '0.00',
            
          },
          
          incomeVsExpenses: {
            income: {
              total: totalIncome,
              paid: paidIncome,
              pending: unpaidIncome,
              count: manualInvoiceStats._count
            },
            expenses: {
              emailInvoices: emailExpenses,
              receipts: receiptExpenses,
              mileage: mileageExpenses,
              total: totalExpenses,
              count: emailInvoiceStats._count + receiptStats._count + mileageStats._count
            }
          },
          
          vatAndTax: {
            totalVAT,
            deductibleExpenses: totalExpenses,
            taxableIncome: totalIncome - totalVAT,
            vatOnPaid: (manualVatSummary.find(v => v.isPaid)?._sum.vat || 0) + (emailVatSummary.find(v => v.isPaid)?._sum.vat || 0),
            vatOnUnpaid: (manualVatSummary.find(v => !v.isPaid)?._sum.vat || 0) + (emailVatSummary.find(v => !v.isPaid)?._sum.vat || 0)
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
          
          invoiceRevenue: {
            manualInvoices: {
              totalRevenue: totalIncome,
              paidAmount: paidIncome,
              pendingAmount: unpaidIncome,
              count: manualInvoiceStats._count,
              averageValue: manualInvoiceStats._count > 0 
                ? (totalIncome / manualInvoiceStats._count).toFixed(2) 
                : '0.00'
            },
            emailInvoices: {
              totalExpenses: emailExpenses,
              paidAmount: paidEmailExpenses,
              pendingAmount: unpaidEmailExpenses,
              count: emailInvoiceStats._count,
              averageValue: emailInvoiceStats._count > 0 
                ? (emailExpenses / emailInvoiceStats._count).toFixed(2) 
                : '0.00'
            }
          },
          
          recentActivity: {
            invoices: recentInvoices,
            receipts: recentReceipts,
            mileages: recentMileages
          },
          
          summary: {
            totalTransactions: manualInvoiceStats._count + emailInvoiceStats._count + receiptStats._count + mileageStats._count + (transactionStats._count || 0),
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
