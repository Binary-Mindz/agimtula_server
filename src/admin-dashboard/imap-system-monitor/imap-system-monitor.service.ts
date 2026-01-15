import { HttpException, Injectable } from '@nestjs/common';
import { formatDistanceToNow } from 'date-fns';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ImapSystemMonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getImapConnectionData() {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const [
        totalConnectionCount,
        totalActiveSyncCount,
        lastInvoiceSynced,
        errorCount,
      ] = await Promise.all([
        this.prisma.imapConfiguration.count({
          where: {
            connect: true,
          },
        }),

        this.prisma.imapConfiguration.count({
          where: {
            sync: true,
            connect: true,
          },
        }),

        this.prisma.imapSyncHistory.findFirst({
          select: {
            syncCompletedAt: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.invoice.count({
          where: {
            createdAt: { gte: startOfToday },
            haveAttachment: false,
          },
        }),
      ]);

      if (!lastInvoiceSynced?.syncCompletedAt) {
        return { syncCompletedAt: null };
      }

      const lastSyncedAgo = formatDistanceToNow(
        new Date(lastInvoiceSynced.syncCompletedAt),
        {
          addSuffix: true,
        },
      );

      return cResponseData({
        data: {
          totalConnectionCount,
          totalActiveSyncCount,
          lastSynced: lastSyncedAgo,
          errorCount,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Data fetching failed', 400);
    }
  }

  async getConnections() {
    try {
      const connections = await this.prisma.imapConfiguration.findMany({
        select: {
          id: true,
          user: {
            select: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              email: {
                select: { email: true },
              },
            },
          },
          connectionStatus: true,
          syncHistory: {
            select: {
              syncCompletedAt: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      const data = await Promise.all(
        connections.map(async (con) => {
          const [invoiceCount, errorCount] = await Promise.all([
            this.prisma.invoice.count({
              where: { invoiceSource: 'EMAIL', imapConfigurationId: con.id },
            }),
            this.prisma.invoice.count({
              where: {
                invoiceSource: 'EMAIL',
                imapConfigurationId: con.id,
                haveAttachment: false,
              },
            }),
          ]);

          return {
            username:
              con.user.profile?.firstName + ' ' + con.user.profile?.lastName,
            email: con.user.email?.email,
            status: con.connectionStatus,
            lastSync:
              con.connectionStatus === 'FAILED'
                ? 'never'
                : formatDistanceToNow(
                    new Date(con.syncHistory[0].syncCompletedAt as Date),
                    { addSuffix: true },
                  ),
            invoiceCount:
              con.connectionStatus === 'FAILED' ? '0' : invoiceCount,
            errorCount: con.connectionStatus === 'FAILED' ? '-' : errorCount,
          };
        }),
      );
      return cResponseData({
        message: 'Connections are fetched successfully',
        data,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get connection data', 400);
    }
  }
}
