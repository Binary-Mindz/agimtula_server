import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class ReportsAndAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async userActivity() {
    try {
      const lastSixMonths = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const lastSixMonthsUsers = await this.prisma.user.findMany({
          where: {
            created_at: {
              gte: lastSixMonths,
            },
            role: 'USER',
            isDeleted: false,
          },
          select: { created_at: true },
        })
       
      const usersActivity: {
        month: string;
        totalUsers: number;
      }[] = [];

      // Process total users
      lastSixMonthsUsers.forEach((item) => {
        const month = item.created_at.getMonth() + 1;
        const year = item.created_at.getFullYear();
        const monthYear = `${year}-${month}`;

        const existingMonth = usersActivity.find((m) => m.month === monthYear);

        if (existingMonth) {
          existingMonth.totalUsers += 1;
        } else {
          usersActivity.push({
            month: monthYear,
            totalUsers: 1
          });
        }
      });

      return cResponseData({
        data: usersActivity,
      });
    } catch (error) {
      console.error('User activity error:', error);
      throw new HttpException(
        'Failed to fetch user activity data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async revenueGrowth() {
    try {
      const subscriptions =
        await this.prisma.userSubscriptionPlanHistory.findMany({
          select: {
            price: true,
            createdAt: true,
          },
        });

      const monthWiseRevenue = subscriptions.reduce(
        (acc, item) => {
          const date = new Date(item.createdAt);
          const month = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}`;

          if (!acc[month]) {
            acc[month] = 0;
          }

          acc[month] += item.price;
          return acc;
        },
        {} as Record<string, number>,
      );

      const result = Object.keys(monthWiseRevenue)
        .sort()
        .map((month) => ({
          month,
          totalPrice: monthWiseRevenue[month],
        }));

      return cResponseData({
        data: result,
      });
    } catch (error) {
      console.error('Revenue growth error:', error);
      throw new HttpException(
        'Failed to fetch revenue growth data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async subscriptionTrends() {
    try {
      const subscriptions =
        await this.prisma.userSubscriptionPlanHistory.findMany({
          select: {
            planName: true,
            price: true,
          },
        });
      const income = subscriptions.reduce(
        (acc, item) => {
          if (!acc[item.planName]) {
            acc[item.planName] = 0;
          }
          acc[item.planName] += item.price;
          return acc;
        },
        {} as Record<string, number>,
      );

      return cResponseData({
        data: income,
      });
    } catch (error) {
      console.error('Subscription trends error:', error);
      throw new HttpException(
        'Failed to fetch subscription trends data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async platformHealth() {
    try {
      const now = new Date();

      // Get all users with role USER
      const [
        totalUsers,
        activeUsers,
        usersWithActiveSubscriptions,
        usersWithRenewedSubscriptions,
        totalPayments,
        successfulPayments,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            role: 'USER',
            isDeleted: false,
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'USER',
            status: true,
            isDeleted: false,
          },
        }),
        this.prisma.userSubscriptionPlan.count({
          where: {
            isActive: true,
            expiredAt: {
              gt: now,
            },
            user: {
              role: 'USER',
              isDeleted: false,
            },
          },
        }),
        this.prisma.user.count({
          where: {
            role: 'USER',
            isDeleted: false,
            userSubscriptionPlanHistory: {
              some: {},
            },
          },
        }),
        this.prisma.subscriptionPlanPaymentStatus.count({}),
        this.prisma.subscriptionPlanPaymentStatus.count({
          where: {
            paymentStatus: 'PAID',
          },
        }),
      ]);

      // Calculate percentages
      const activeUsersPercentage =
        totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

      // Subscription Retention 1: Active subscriptions out of total users
      const subscriptionRetentionPercentage =
        totalUsers > 0 ? (usersWithActiveSubscriptions / totalUsers) * 100 : 0;

      // Subscription Retention 2: Active subscriptions out of users who have ever subscribed
      const subscriptionRetentionFromSubscribers =
        usersWithRenewedSubscriptions > 0
          ? (usersWithActiveSubscriptions / usersWithRenewedSubscriptions) * 100
          : 0;

      const paymentSuccessRate =
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      return cResponseData({
        data: {
          activeUsers: Number(activeUsersPercentage.toFixed(2)),
          subscriptionRetention: Number(
            subscriptionRetentionPercentage.toFixed(2),
          ),
          subscriptionRetentionFromSubscribers: Number(
            subscriptionRetentionFromSubscribers.toFixed(2),
          ),
          paymentSuccessRate: Number(paymentSuccessRate.toFixed(2)),
        },
      });
    } catch (error) {
      console.error('Platform health error:', error);
      throw new HttpException(
        'Failed to fetch platform health data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAdminAnalytics() {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const lastSixMonths = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 5,
        1,
      );

      const [
        revenueAnalysis,
        userActivityData,
        monthlyFinancialData,
        platformMetrics
      ] = await Promise.all([
        this.getRevenueAnalysis(yearStart),
        this.getUserActivityReport(lastSixMonths),
        this.getMonthlyFinancialReport(yearStart),
        this.getPlatformMetrics()
      ]);

      return cResponseData({
        success: true,
        message: 'Admin analytics retrieved successfully',
        data: {
          revenueAnalysis,
          userActivity: userActivityData,
          monthlyFinancial: monthlyFinancialData,
          platformMetrics,
          summary: {
            dataRange: `${yearStart.toISOString().split('T')[0]} to ${new Date().toISOString().split('T')[0]}`,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Admin analytics error:', error);
      throw new HttpException(
        'Failed to retrieve admin analytics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getRevenueAnalysis(yearStart: Date) {
    const [
      totalRevenue,
      monthlyRevenue,
      planRevenue,
      paymentStats
    ] = await Promise.all([
      // Total revenue
      this.prisma.userSubscriptionPlanHistory.aggregate({
        where: { createdAt: { gte: yearStart } },
        _sum: { price: true, setupFee: true },
        _count: true
      }),
      
      // Monthly revenue breakdown
      this.prisma.userSubscriptionPlanHistory.findMany({
        where: { createdAt: { gte: yearStart } },
        select: { price: true, setupFee: true, createdAt: true }
      }),
      
      // Revenue by plan
      this.prisma.userSubscriptionPlanHistory.groupBy({
        by: ['planName'],
        where: { createdAt: { gte: yearStart } },
        _sum: { price: true, setupFee: true },
        _count: true
      }),
      
      // Payment success rate
      this.prisma.subscriptionPlanPaymentStatus.groupBy({
        by: ['paymentStatus'],
        _count: true
      })
    ]);

    // Process monthly revenue
    const monthlyBreakdown = monthlyRevenue.reduce((acc, item) => {
      const month = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[month]) acc[month] = 0;
      acc[month] += (item.price || 0) + (item.setupFee || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue: (totalRevenue._sum.price || 0) + (totalRevenue._sum.setupFee || 0),
      totalTransactions: totalRevenue._count,
      monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, revenue]) => ({ month, revenue })),
      planBreakdown: planRevenue.map(plan => ({
        planName: plan.planName,
        revenue: (plan._sum.price || 0) + (plan._sum.setupFee || 0),
        subscriptions: plan._count
      })),
      paymentStats: paymentStats.map(stat => ({
        status: stat.paymentStatus,
        count: stat._count
      }))
    };
  }

  private async getUserActivityReport(lastSixMonths: Date) {
    const [
      userRegistrations,
      activeUsers,
      subscriptionActivity,
      imapUsage
    ] = await Promise.all([
      // User registrations
      this.prisma.user.findMany({
        where: {
          created_at: { gte: lastSixMonths },
          role: 'USER',
          isDeleted: false
        },
        select: { created_at: true }
      }),
      
      // Active users (with recent activity)
      this.prisma.user.count({
        where: {
          role: 'USER',
          status: true,
          isDeleted: false,
          updated_at: { gte: lastSixMonths }
        }
      }),
      
      // Subscription activity
      this.prisma.userSubscriptionPlan.count({
        where: {
          isActive: true,
          expiredAt: { gt: new Date() }
        }
      }),
      
      // IMAP configuration usage
      this.prisma.imapConfiguration.count({
        where: {
          connect: true,
          sync: true
        }
      })
    ]);

    // Process monthly registrations
    const monthlyRegistrations = userRegistrations.reduce((acc, user) => {
      const month = `${user.created_at.getFullYear()}-${String(user.created_at.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[month]) acc[month] = 0;
      acc[month]++;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRegistrations: userRegistrations.length,
      activeUsers,
      activeSubscriptions: subscriptionActivity,
      imapActiveUsers: imapUsage,
      monthlyRegistrations: Object.entries(monthlyRegistrations).map(([month, count]) => ({ month, count }))
    };
  }

  private async getMonthlyFinancialReport(yearStart: Date) {
    const [
      invoiceStats,
      receiptStats,
      mileageStats,
      subscriptionStats
    ] = await Promise.all([
      // All invoices (user-generated content)
      this.prisma.invoice.aggregate({
        where: { createdAt: { gte: yearStart } },
        _sum: { totalAmount: true, vat: true },
        _count: true
      }),
      
      // All receipts
      this.prisma.receipt.aggregate({
        where: { date: { gte: yearStart } },
        _sum: { amount: true },
        _count: true
      }),
      
      // All mileage
      this.prisma.mileage.aggregate({
        where: { date: { gte: yearStart } },
        _sum: { amount: true, distance: true },
        _count: true
      }),
      
      // Platform subscription revenue
      this.prisma.userSubscriptionPlanHistory.aggregate({
        where: { createdAt: { gte: yearStart } },
        _sum: { price: true, setupFee: true },
        _count: true
      })
    ]);

    const totalUserInvoiceValue = invoiceStats._sum.totalAmount || 0;
    const totalUserExpenses = (receiptStats._sum.amount || 0) + (mileageStats._sum.amount || 0);
    const totalPlatformRevenue = (subscriptionStats._sum.price || 0) + (subscriptionStats._sum.setupFee || 0);

    return {
      platformRevenue: {
        total: totalPlatformRevenue,
        subscriptions: subscriptionStats._count,
        averageRevenue: subscriptionStats._count > 0 ? (totalPlatformRevenue / subscriptionStats._count).toFixed(2) : '0.00'
      },
      userFinancialActivity: {
        totalInvoiceValue: totalUserInvoiceValue,
        totalExpenses: totalUserExpenses,
        invoiceCount: invoiceStats._count,
        receiptCount: receiptStats._count,
        mileageCount: mileageStats._count,
        totalVAT: invoiceStats._sum.vat || 0
      },
      platformHealth: {
        totalTransactions: invoiceStats._count + receiptStats._count + mileageStats._count + subscriptionStats._count,
        userEngagement: ((invoiceStats._count + receiptStats._count + mileageStats._count) / Math.max(subscriptionStats._count, 1)).toFixed(2)
      }
    };
  }

  private async getPlatformMetrics() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      activeSubscriptions,
      trialUsers,
      churnRate,
      revenueGrowth
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: 'USER', isDeleted: false }
      }),
      
      this.prisma.userSubscriptionPlan.count({
        where: {
          isActive: true,
          expiredAt: { gt: now }
        }
      }),
      
      this.prisma.userSubscriptionPlanHistory.count({
        where: {
          freeTrialDays: { gt: 0 },
          subscriptionPlanPaymentStatus: {
            paymentStatus: { not: 'PAID' }
          }
        }
      }),
      
      // Churn rate (expired subscriptions in last month)
      this.prisma.userSubscriptionPlan.count({
        where: {
          expiredAt: {
            gte: lastMonth,
            lt: now
          }
        }
      }),
      
      // Revenue growth (current vs last month)
      Promise.all([
        this.prisma.userSubscriptionPlanHistory.aggregate({
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lt: now
            }
          },
          _sum: { price: true, setupFee: true }
        }),
        this.prisma.userSubscriptionPlanHistory.aggregate({
          where: {
            createdAt: {
              gte: lastMonth,
              lt: new Date(now.getFullYear(), now.getMonth(), 1)
            }
          },
          _sum: { price: true, setupFee: true }
        })
      ])
    ]);

    const currentMonthRevenue = (revenueGrowth[0]._sum.price || 0) + (revenueGrowth[0]._sum.setupFee || 0);
    const lastMonthRevenue = (revenueGrowth[1]._sum.price || 0) + (revenueGrowth[1]._sum.setupFee || 0);
    const growthRate = lastMonthRevenue > 0 ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(2) : '0.00';

    return {
      totalUsers,
      activeSubscriptions,
      trialUsers,
      subscriptionRate: totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(2) : '0.00',
      churnRate: activeSubscriptions > 0 ? ((churnRate / activeSubscriptions) * 100).toFixed(2) : '0.00',
      revenueGrowth: `${growthRate}%`,
      currentMonthRevenue,
      lastMonthRevenue
    };
  }
}
