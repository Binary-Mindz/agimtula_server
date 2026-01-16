import { HttpException, Injectable } from '@nestjs/common';
import { formatDistanceToNow } from 'date-fns';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';
import { ImapSystemMonitorGateway } from './imap-system-monitor.gateway';

@Injectable()
export class ImapSystemMonitorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    private readonly gateway: ImapSystemMonitorGateway,
  ) {}

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
          include: {
            user: {
              include: {
                profile: true,
                email: true,
              },
            },
          },
        });

        if (!connection) {
          throw new HttpException('Connection not found', 404);
        }

        await this.prisma.imapConfiguration.update({
          where: { id },
          data: {
            connect: false,
            sync: false,
            connectionStatus: 'FAILED',
          },
        });

        // Log admin action
        const userName = `${connection.user.profile?.firstName} ${connection.user.profile?.lastName}`;
        await this.activityLog.log({
          userName,
          userEmail: connection.user.email?.email,
          type: 'IMAP_DISCONNECTED',
          title: `Admin disconnected IMAP for ${userName}`,
          category: 'ADMIN',
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

    async getRecentImports() {
      try {
        const imports = await this.prisma.invoice.findMany({
          where: { invoiceSource: 'EMAIL' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            userId: true,
            createdAt: true,
            haveAttachment: true,
          },
        });

        const userIds = [...new Set(imports.map((inv) => inv.userId))];
        const users = await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
            email: { select: { email: true } },
          },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        const data = imports.map((inv) => {
          const user = userMap.get(inv.userId);
          return {
            id: inv.id,
            userName: user?.profile
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : 'Unknown',
            userEmail: user?.email?.email || 'Unknown',
            status: inv.haveAttachment ? 'success' : 'error',
            timestamp: formatDistanceToNow(new Date(inv.createdAt), {
              addSuffix: true,
            }),
          };
        });

        return cResponseData({ data });
      } catch {
        throw new HttpException('Failed to fetch recent imports', 400);
      }
    }

    notifyInvoiceImport(invoiceData: any) {
      if (this.gateway) {
        this.gateway.emitInvoiceImport(invoiceData);
      } else {
        console.error('Gateway instance is null!');
      }
    }
}
