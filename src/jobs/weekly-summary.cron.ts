import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { weeklySummaryEmailTemplate } from 'src/common/email-templates/weeklySummaryEmailTemplate';

@Injectable()
export class WeeklySummaryCronService {
  private readonly logger = new Logger(WeeklySummaryCronService.name);

  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-summary',
    timeZone: 'Europe/Amsterdam',
  })
  async sendWeeklySummary() {
    this.logger.log('Starting weekly summary email job...');

    try {
      const users = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          role: 'USER',
        },
        include: {
          profile: true,
          email: true,
        },
      });

      for (const user of users) {
        try {
          await this.generateAndSendSummary(user);
        } catch (error) {
          this.logger.error(`Failed to send summary for user ${user.id}:`, error);
        }
      }

      this.logger.log(`Weekly summary sent to ${users.length} users`);
    } catch (error) {
      this.logger.error('Weekly summary cron job failed:', error);
    }
  }

  private async generateAndSendSummary(user: any) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay() - 7));
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const weekPeriod = `${weekStart.toLocaleDateString('en-GB')} - ${weekEnd.toLocaleDateString('en-GB')}`;

    // Get week's data
    const [
      invoicesCreated,
      invoicesSent,
      invoicesPaid,
      totalInvoiceAmount,
      pendingInvoices,
      overdueInvoices,
      receiptExpenses,
      mileageData,
      recentActivities,
      previousWeekRevenue,
      previousWeekExpenses,
    ] = await Promise.all([
      this.prisma.invoice.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      this.prisma.invoice.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
          isDrafted: false,
        },
      }),
      this.prisma.invoice.count({
        where: {
          userId: user.id,
          isPaid: true,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      this.prisma.invoice.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.count({
        where: {
          userId: user.id,
          isPaid: false,
        },
      }),
      this.prisma.invoice.count({
        where: {
          userId: user.id,
          isPaid: false,
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.receipt.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.mileage.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { amount: true, distance: true },
      }),
      this.prisma.activityLog.findMany({
        where: {
          userId: user.id,
          category: 'USER',
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.invoice.aggregate({
        where: {
          userId: user.id,
          isPaid: true,
          createdAt: {
            gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: weekStart,
          },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.receipt.aggregate({
        where: {
          userId: user.id,
          createdAt: {
            gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: weekStart,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = totalInvoiceAmount._sum.totalAmount || 0;
    const totalExpenses = (receiptExpenses._sum.amount || 0) + (mileageData._sum.amount || 0);
    const netProfit = totalRevenue - totalExpenses;

    const revenueChange = previousWeekRevenue._sum.totalAmount 
      ? ((totalRevenue - previousWeekRevenue._sum.totalAmount) / previousWeekRevenue._sum.totalAmount) * 100
      : 0;

    const expenseChange = previousWeekExpenses._sum.amount
      ? ((totalExpenses - previousWeekExpenses._sum.amount) / previousWeekExpenses._sum.amount) * 100
      : 0;

    const recommendations = this.generateRecommendations({
      overdueInvoices,
      pendingInvoices,
      netProfit,
      totalRevenue,
      invoicesCreated,
    });

    const emailData = {
      userName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'User',
      weekPeriod,
      invoicesCreated,
      invoicesSent,
      invoicesPaid,
      totalInvoiceAmount: totalRevenue,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      totalExpenses,
      netProfit,
      receiptExpenses: receiptExpenses._sum.amount || 0,
      mileageExpenses: mileageData._sum.amount || 0,
      totalMileage: mileageData._sum.distance || 0,
      recentActivities: recentActivities.map(activity => ({
        type: activity.type,
        title: activity.title,
        amount: activity.amount || undefined,
        timeAgo: this.getTimeAgo(activity.createdAt),
      })),
      revenueChange,
      expenseChange,
      recommendations,
      currency: 'EUR',
      appUrl: process.env.FRONTEND_URL!,
      logoUrl: 'https://res.cloudinary.com/do7dsop94/image/upload/v1769020717/Frame_2147226279_vkzimt.png',
    };

    await this.mail.sendMail(
      user.email?.email,
      `📊 Your Weekly Business Summary - ${weekPeriod}`,
      weeklySummaryEmailTemplate(emailData)
    );

    this.logger.log(`Weekly summary sent to ${user.email?.email}`);
  }

  private generateRecommendations(data: {
    overdueInvoices: number;
    pendingInvoices: number;
    netProfit: number;
    totalRevenue: number;
    invoicesCreated: number;
  }): string[] {
    const recommendations: string[] = [];

    if (data.overdueInvoices > 0) {
      recommendations.push(`You have ${data.overdueInvoices} overdue invoice${data.overdueInvoices > 1 ? 's' : ''}. Follow up with clients to improve cash flow.`);
    }

    if (data.pendingInvoices > 5) {
      recommendations.push('Consider offering early payment discounts to reduce pending invoices.');
    }

    if (data.netProfit < 0) {
      recommendations.push('Your expenses exceeded revenue this week. Review your spending and consider cost optimization.');
    }

    if (data.invoicesCreated === 0) {
      recommendations.push('No invoices created this week. Consider reaching out to potential clients or following up on quotes.');
    }

    if (data.totalRevenue > 0 && data.netProfit / data.totalRevenue > 0.3) {
      recommendations.push('Great profit margin! Consider reinvesting in business growth or marketing.');
    }

    return recommendations;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }
}