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
            id: con.id,
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
    
    async getConnectionById(id: string) {
      try {
        const connection = await this.prisma.imapConfiguration.findUnique({
          where: { id },
          select: {
            id: true,
            host: true,
            port: true,
            username: true,
            connect: true,
            sync: true,
            connectionStatus: true,
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

        if (!connection) {
          throw new HttpException('Connection not found', 404);
        }

        const [invoiceCount, errorCount] = await Promise.all([
          this.prisma.invoice.count({
            where: { invoiceSource: 'EMAIL', imapConfigurationId: connection.id },
          }),
          this.prisma.invoice.count({
            where: {
              invoiceSource: 'EMAIL',
              imapConfigurationId: connection.id,
              haveAttachment: false,
            },
          }),
        ]);

        const data = {
          id: connection.id,
          username:
            connection.user.profile?.firstName +
            ' ' +
            connection.user.profile?.lastName,
          email: connection.user.email?.email,
          imapEmail: connection.username,
          host: connection.host,
          port: connection.port,
          status: connection.connectionStatus,
          isConnected: connection.connect,
          isSyncEnabled: connection.sync,
          lastSync:
            connection.connectionStatus === 'FAILED'
              ? 'never'
              : formatDistanceToNow(
                  new Date(connection.syncHistory[0].syncCompletedAt as Date),
                  { addSuffix: true },
                ),
          invoiceCount:
            connection.connectionStatus === 'FAILED' ? 0 : invoiceCount,
          errorCount: connection.connectionStatus === 'FAILED' ? 0 : errorCount,
        };

        return cResponseData({
          message: 'Connection fetched successfully',
          data,
        });
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException('Failed to fetch connection', 400);
      }
    }

    async disconnectUser(id: string) {
      try {
        const connection = await this.prisma.imapConfiguration.findUnique({
          where: { id },
        });

        if (!connection) {
          throw new HttpException('Connection not found', 404);
        }

        await this.prisma.imapConfiguration.update({
          where: { id },
          data: {
            connect: false,
            sync: false,
          },
        });

        return cResponseData({
          message: 'User disconnected successfully',
        });
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException('Failed to disconnect user', 400);
      }
    }
}
