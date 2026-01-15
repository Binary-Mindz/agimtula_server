import { HttpException, Injectable } from '@nestjs/common';
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

        this.prisma.imapConfiguration.findFirst({
          where: {
            connect: true,
            syncHistory: {
              some: {
                syncType: 'CRON',
              },
            },
          },
          select: {
            sync: true,
            syncHistory: {
              select: {
                syncType: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.invoice.count({
          where: {
            createdAt: { gte: startOfToday },
            haveAttachment: false,
          },
        }),
      ]);

      return cResponseData({
        data: {
          totalConnectionCount,
          totalActiveSyncCount,
          lastInvoiceSynced,
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
}
