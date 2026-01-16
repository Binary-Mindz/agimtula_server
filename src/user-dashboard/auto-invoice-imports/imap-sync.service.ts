import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapApisService } from '../../imap-apis/imap-apis.service';
import { Invoice, SyncInterval } from 'prisma/generated/prisma/client';
import { CronConfigService } from '../../imap-apis/cronConfig.service';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';
import { ImapSystemMonitorService } from 'src/admin-dashboard/imap-system-monitor/imap-system-monitor.service';
import { formatDistanceToNow } from 'date-fns';

@Injectable()
export class ImapSyncService {
  constructor(
    private prisma: PrismaService,
    private imapApisService: ImapApisService,
    private cronConfigService: CronConfigService,
    private activityLog: ActivityLogService,
    private imapMonitor: ImapSystemMonitorService,
  ) {}

  async syncEmails(userId: string): Promise<Invoice[]> {
    const syncStartedAt = new Date();
    let syncHistoryId: string | null = null;

    try {
      const subscription = await this.prisma.userSubscriptionPlan.findUnique({
        where: { UserId: userId, isActive: true },
      });

      if (!subscription) {
        throw new HttpException(
          'No active subscription found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Check invoice limit
      if (subscription.isLimitedInvoicePerMonth) {
        const currentMonth = new Date();
        const startOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );
        const endOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          0,
        );

        const invoiceCount = await this.prisma.invoice.count({
          where: {
            userId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        if (invoiceCount >= subscription.perMonthInvoiceCount) {
          throw new HttpException(
            `Monthly invoice limit reached (${subscription.perMonthInvoiceCount}). Upgrade your plan to sync more invoices.`,
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
        include: { realtimeImapChecking: true },
      });

      if (!imapConfig) {
        throw new HttpException(
          'IMAP configuration not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (!imapConfig.connect) {
        throw new HttpException('IMAP not connected', HttpStatus.BAD_REQUEST);
      }

      if (!imapConfig.sync || !imapConfig.realtimeImapChecking) {
        throw new HttpException(
          'Sync disabled or no interval set',
          HttpStatus.BAD_REQUEST,
        );
      }

      const allowedIntervalIds = subscription.realtimeImapChecking;
      const selectedIntervalId = imapConfig.realtimeImapCheckingId;

      if (
        !selectedIntervalId ||
        !allowedIntervalIds.includes(selectedIntervalId)
      ) {
        throw new HttpException(
          'Interval not allowed in subscription plan',
          HttpStatus.FORBIDDEN,
        );
      }

      // Create sync history record
      const syncHistory = await this.prisma.imapSyncHistory.create({
        data: {
          imapConfigurationId: imapConfig.id,
          syncStartedAt,
          status: 'SUCCESS',
          syncType: 'MANUAL',
          invoicesFound: 0,
          invoicesCreated: 0,
        },
      });
      syncHistoryId = syncHistory.id;

      const lastSyncDate = imapConfig.lastSync || imapConfig.created_at;

      console.log('Syncing emails since:', lastSyncDate);
      console.log('Current time:', new Date());

      const newInvoices = await this.imapApisService.readEmailTransactionsSince(
        userId,
        lastSyncDate,
      );

      console.log('Found invoices:', newInvoices.length);

      const syncCompletedAt = new Date();

      // Update sync history with results
      await this.prisma.imapSyncHistory.update({
        where: { id: syncHistoryId },
        data: {
          syncCompletedAt,
          status: newInvoices.length > 0 ? 'SUCCESS' : 'SUCCESS',
          invoicesFound: newInvoices.length,
          invoicesCreated: newInvoices.length,
        },
      });

      // Update lastSync if invoices were found
      if (newInvoices.length > 0) {
        await this.prisma.imapConfiguration.update({
          where: { userId },
          data: { lastSync: syncCompletedAt },
        });

        // Get user info for notifications
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true, email: true },
        });

        // Notify via WebSocket for each invoice
        console.log('Notifying WebSocket for', newInvoices.length, 'invoices');
        for (const invoice of newInvoices) {
          const notificationData = {
            id: invoice.id,
            userName: user?.profile
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : 'Unknown',
            userEmail: user?.email?.email || 'Unknown',
            status: invoice.haveAttachment ? 'success' : 'error',
            timestamp: formatDistanceToNow(new Date(invoice.createdAt), {
              addSuffix: true,
            }),
          };
          console.log('Sending notification:', notificationData);
          this.imapMonitor.notifyInvoiceImport(notificationData);
        }

        // Log successful sync
        await this.activityLog.log({
          userId,
          type: 'IMAP_SYNCED',
          title: `Synced ${newInvoices.length} invoices from email`,
          category: 'USER',
        });

        // Log to system logs
        await this.activityLog.log({
          type: 'IMAP_SYNC_SUCCESS',
          title: `IMAP sync completed: ${newInvoices.length} invoices`,
          category: 'SYSTEM',
          level: 'INFO',
        });
      }

      return newInvoices;
    } catch (error) {
      // Log sync failure
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { email: true },
      });

      if (user?.email) {
        await this.activityLog.log({
          userEmail: user.email.email,
          type: 'IMAP_SYNC_FAILED',
          title: `IMAP sync failed for user ${user.email.email}`,
          description:
            error instanceof HttpException ? error.message : 'Unknown error',
          category: 'SYSTEM',
          level: 'ERROR',
        });
      }
      // Update sync history with error
      if (syncHistoryId) {
        await this.prisma.imapSyncHistory.update({
          where: { id: syncHistoryId },
          data: {
            syncCompletedAt: new Date(),
            status: 'FAILED',
            errorMessage:
              error instanceof HttpException
                ? error.message
                : 'Unknown error occurred',
          },
        });
      }

      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Sync emails error:', error);
      throw new HttpException(
        'Failed to sync emails',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLastSyncInfo(userId: string) {
    try {
      const imapConfig = await this.prisma.imapConfiguration.findFirst({
        where: { userId },
        select: {
          lastSync: true,
          created_at: true,
          sync: true,
        },
      });

      if (!imapConfig) {
        throw new HttpException(
          'IMAP configuration not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        lastSync: imapConfig.lastSync,
        configCreated: imapConfig.created_at,
        syncEnabled: imapConfig.sync,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get last sync info error:', error);
      throw new HttpException(
        'Failed to get sync info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async resetLastSync(userId: string) {
    try {
      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
      });

      if (!imapConfig) {
        throw new HttpException(
          'IMAP configuration not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.imapConfiguration.update({
        where: { userId },
        data: { lastSync: null },
      });

      return { message: 'Last sync reset' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Reset last sync error:', error);
      throw new HttpException(
        'Failed to reset last sync',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setSyncInterval(userId: string, interval: SyncInterval) {
    try {
      const subscription = await this.prisma.userSubscriptionPlan.findUnique({
        where: { UserId: userId, isActive: true },
        include: { subscriptionPlanPaymentStatus: true },
      });

      if (
        !subscription ||
        subscription.subscriptionPlanPaymentStatus.paymentStatus !== 'PAID'
      ) {
        throw new HttpException(
          'No active paid subscription found',
          HttpStatus.FORBIDDEN,
        );
      }

      const cronMap = {
        [SyncInterval.DAILY]: '0 0 * * *',
        [SyncInterval.HOURLY]: '0 * * * *',
        [SyncInterval.EVERY_15_MINUTES]: '*/15 * * * *',
      };

      const intervalData = {
        [SyncInterval.DAILY]: {
          title: 'Daily Sync',
          description: 'Sync emails daily',
        },
        [SyncInterval.HOURLY]: {
          title: 'Hourly Sync',
          description: 'Sync emails every hour',
        },
        [SyncInterval.EVERY_15_MINUTES]: {
          title: '15 Min Sync',
          description: 'Sync emails every 15 minutes',
        },
      };

      let syncInterval = await this.prisma.invoiceAutoSyncInterval.findFirst({
        where: { interval },
      });

      if (!syncInterval) {
        syncInterval = await this.prisma.invoiceAutoSyncInterval.create({
          data: {
            title: intervalData[interval].title,
            description: intervalData[interval].description,
            interval,
            cronTime: cronMap[interval],
          },
        });
      }

      if (!subscription.realtimeImapChecking.includes(syncInterval.id)) {
        throw new HttpException(
          'Selected interval not available in your subscription plan',
          HttpStatus.FORBIDDEN,
        );
      }

      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
      });

      if (!imapConfig) {
        throw new HttpException(
          'IMAP configuration not found',
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.imapConfiguration.update({
        where: { userId },
        data: {
          realtimeImapCheckingId: syncInterval.id,
          sync: true,
        },
      });

      await this.cronConfigService.setupCronForUser(userId);

      return { interval, cron: cronMap[interval] };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Set sync interval error:', error);
      throw new HttpException(
        'Failed to set sync interval',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
