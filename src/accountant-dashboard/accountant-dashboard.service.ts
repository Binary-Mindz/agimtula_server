import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
// import { TransactionQueryDto } from './dto/TransactionQueryDto';
// import { TransactionStatus } from 'prisma/generated/prisma/enums';
// import { NotFoundAppException } from 'src/common/app-exceptions';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class AccountantDashboardService {
  constructor(private readonly prisma: PrismaService) { }

  async getActivityFeed(accountantId: string) {
    try {
      const clients = await this.prisma.user.findMany({
        where: { accountantId, isDeleted: false, role: 'USER' },
        select: {
          id: true,
          email: { select: { email: true } },
          profile: { select: { firstName: true, lastName: true } },
        },
      });

      const clientIds = clients.map((c) => c.id);
      const userMap = new Map(
        clients.map((c) => [
          c.id,
          {
            name: c.profile
              ? `${c.profile.firstName} ${c.profile.lastName}`
              : null,
            email: c.email?.email || null,
          },
        ]),
      );

      const activities = await this.prisma.activityLog.findMany({
        where: {
          userId: { in: clientIds },
          category: 'USER',
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const enrichedActivities = activities.map((activity) => {
        const userInfo = activity.userId ? userMap.get(activity.userId) : null;
        return {
          ...activity,
          userName: activity.userName || userInfo?.name || null,
          userEmail: activity.userEmail || userInfo?.email || null,
        };
      });

      return cResponseData({
        message: 'Activity feed fetched successfully',
        data: enrichedActivities,
      });
    } catch (error) {
      console.error('Get activity feed error:', error);
      throw new HttpException(
        'Failed to fetch activity feed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async fetchAccountantDashboardData(accId: string) {
    try {
      if (!accId) {
        throw new HttpException(
          'Accountant ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const clients = await this.prisma.user.findMany({
        where: {
          accountantId: accId,
          isDeleted: false,
          role: 'USER',
        },
        select: { id: true },
      });

      const clientIds = clients.map((client) => client.id);

      const [
        totalClients,
        newPurchaseInvoice,
        missingDocuments,
        newSalesInvoice,
        unmatchedBankTransactions,
      ] = await Promise.all([
        this.prisma.user.count({
          where: {
            accountantId: accId,
            isDeleted: false,
            role: 'USER',
          },
        }),

        this.prisma.invoice.count({
          where: {
            userId: { in: clientIds },
            invoiceSource: 'EMAIL',
            haveAttachment: true,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        }),
        this.prisma.invoice.count({
          where: {
            userId: { in: clientIds },
            invoiceSource: 'EMAIL',
            haveAttachment: false,
          },
        }),

        this.prisma.invoice.count({
          where: {
            userId: { in: clientIds },
            invoiceSource: 'MANUAL',
            previewedByAccountant: false,
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        }),
        this.prisma.transaction.count({
          where: {
            userId: { in: clientIds },
            status: 'UNMATCHED',
            createdAt: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
        }),
      ]);

      return cResponseData({
        message: 'Accountant dashboard data fetched successfully',
        data: {
          totalClients,
          newPurchaseInvoice,
          missingDocuments,
          newSalesInvoice,
          unmatchedBankTransactions,
        },
      });
    } catch (error) {
      console.error('Get accountant dashboard data error:', error);
      throw new HttpException(
        'Failed to fetch accountant dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async findAll(
  //   userId: string,
  //   accountantId: string,
  //   query: TransactionQueryDto,
  // ) {
  //   try {
  //     const ACCOUNTANT = await this.prisma.user.findFirst({
  //       where: { id: accountantId },
  //     });
  //     console.log(accountantId);
  //     if (!ACCOUNTANT) {
  //       throw new NotFoundAppException('User not found');
  //     }

  //     const userExist = await this.prisma.user.findFirst({
  //       where: { id: userId },
  //     });
  //     console.log({ userExist });

  //     if (!userExist) {
  //       throw new NotFoundAppException('Client not found');
  //     }
  //     if (accountantId !== userExist.accountantId) {
  //       throw new NotFoundAppException('Client id mismatch');
  //     }

  //     const page = query.page ?? 1;
  //     const limit = query.limit ?? 10;
  //     const skip = (page - 1) * limit;
  //     const search = query.search;

  //     // Type-safe status handling
  //     const statusFilter =
  //       query.status && Object.values(TransactionStatus).includes(query.status)
  //         ? query.status
  //         : undefined;

  //     // =========================
  //     // 3️⃣ Fetch transactions with search/status/pagination
  //     // =========================
  //     const transaction = await this.prisma.transaction.findMany({
  //       where: {
  //         userId,
  //         ...(statusFilter && { status: statusFilter }),
  //         ...(search && {
  //           OR: [
  //             { description: { contains: search, mode: 'insensitive' } },
  //             { currency: { contains: search, mode: 'insensitive' } },
  //           ],
  //         }),
  //       },
  //       orderBy: { date: 'desc' },
  //       skip,
  //       take: limit,
  //     });
  //     // Total count for pagination
  //     const totalCount = await this.prisma.transaction.count({
  //       where: {
  //         userId,
  //         ...(statusFilter && { status: statusFilter }),
  //         ...(search && {
  //           OR: [
  //             { description: { contains: search, mode: 'insensitive' } },
  //             { currency: { contains: search, mode: 'insensitive' } },
  //           ],
  //         }),
  //       },
  //     });

  //     const now = new Date();
  //     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  //     const endOfMonth = new Date(
  //       now.getFullYear(),
  //       now.getMonth() + 1,
  //       0,
  //       23,
  //       59,
  //       59,
  //       999,
  //     );

  //     const thisMonthTransactions = transaction.filter((trx) => {
  //       const trxDate = new Date(trx.date);
  //       return trxDate >= startOfMonth && trxDate <= endOfMonth;
  //     });

  //     const totalByCurrency = thisMonthTransactions.reduce(
  //       (acc, trx) => {
  //         const amount = Number(trx.amount);
  //         acc[trx.currency] = (acc[trx.currency] || 0) + amount;
  //         return acc;
  //       },
  //       {} as Record<string, number>,
  //     );

  //     const summary = {
  //       totalTransactions: thisMonthTransactions.length,
  //       matched: 0,
  //       unmatched: 0,
  //       missingReceipt: 0,
  //     };

  //     for (const trx of thisMonthTransactions) {
  //       if (trx.status === 'MATCHED') summary.matched++;
  //       if (trx.status === 'UNMATCHED') summary.unmatched++;
  //     }

  //     return cResponseData({
  //       message: 'Transactions retrieved successfully',
  //       data: {
  //         totalByCurrency,
  //         summary,
  //         transactions: transaction,
  //         pagination: {
  //           page,
  //           limit,
  //           total: totalCount,
  //           totalPages: Math.ceil(totalCount / limit),
  //         },
  //       },
  //     });
  //   } catch (error) {
  //     if (error instanceof NotFoundAppException) {
  //       throw error;
  //     }
  //     console.error('Find all transactions error:', error);
  //     throw new HttpException(
  //       'Failed to retrieve transactions',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  async getRecentActivities(accountantId: string, limit = 5) {
    try {
      if (!accountantId) {
        throw new HttpException(
          'Accountant ID is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const clients = await this.prisma.user.findMany({
        where: {
          accountantId,
          isDeleted: false,
          role: 'USER',
        },
        select: { id: true },
      });

      const clientIds = clients.map((client) => client.id);

      const activities = await this.prisma.activityLog.findMany({
        where: {
          userId: { in: clientIds },
          category: 'USER',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const formattedActivities = activities.map((activity) => ({
        userName: activity.userName || 'Client',
        description: activity.title,
        timeAgo: formatDistanceToNow(new Date(activity.createdAt), {
          addSuffix: true,
        }),
        amount: activity.amount,
        currency: activity.currency,
      }));

      return cResponseData({
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

  async workloadLastSevenDay(accountantId: string) {
    try {

      const users = await this.prisma.user.findMany({
        where: {
          accountantId: accountantId,
          isDeleted: false,
          role: 'USER'
        },
        select: { id: true }
      });

      const userIds = users.map(user => user.id);

      const workLoad = await this.prisma.invoice.findMany({
        where: {
          userId: { in: userIds },
          invoiceSource: "EMAIL",
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7))
          }
        },
        select: {
          createdAt: true
        }
      });

      const dailyData: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const count = workLoad.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt);
          return invoiceDate >= dayStart && invoiceDate <= dayEnd;
        }).length;

        dailyData.push({
          date: dayStart.toISOString().split('T')[0],
          count
        });
      }

      return cResponseData({
        message: 'Workload data fetched successfully',
        data: dailyData
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to fetch workload data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async clientAlerts(accountantId: string) {
    try {
      const clients = await this.prisma.user.findMany({
        where: {
          isDeleted: false,
          role: 'USER',
          accountantId: accountantId
        },
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          email: {
            select: {
              email: true
            }
          }
        }
      });

      const clientWorkloads = await Promise.all(
        clients.map(async client => {
          const invoiceCount = await this.prisma.invoice.count({
            where: {
              userId: client.id,
              previewedByAccountant: false,
              invoiceSource: "EMAIL"
            }
          });

          return {
            clientId: client.id,
            clientName: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim(),
            clientEmail: client.email?.email,
            pendingInvoices: invoiceCount
          };
        })
      );

      const top3Clients = clientWorkloads
        .sort((a, b) => b.pendingInvoices - a.pendingInvoices)
        .slice(0, 3);

      return cResponseData({
        message: 'Client alerts fetched successfully',
        data: top3Clients
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        'Failed to fetch client alerts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
