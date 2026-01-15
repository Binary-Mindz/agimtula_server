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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Failed to get connection data', 400);
    }
  }
}
