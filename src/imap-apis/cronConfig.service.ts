import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapApisService } from './imap-apis.service';

@Injectable()
export class CronConfigService implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService,
    private imapApisService: ImapApisService,
  ) {}

  async onModuleInit() {
    await this.initializeAllCronJobs();
  }

  async initializeAllCronJobs() {
    const activeSubscriptions = await this.prisma.userSubscriptionPlan.findMany(
      {
        where: { isActive: true },
        select: { UserId: true },
      },
    );

    for (const sub of activeSubscriptions) {
      await this.setupCronForUser(sub.UserId);
    }

  }

  async setupCronForUser(userId: string) {
    const subscription = await this.prisma.userSubscriptionPlan.findUnique({
      where: { UserId: userId, isActive: true },
    });

    if (!subscription) {
      return;
    }

    const imapConfig = await this.prisma.imapConfiguration.findUnique({
      where: { userId, connect: true },
      include: { realtimeImapChecking: true },
    });

    if (!imapConfig) {
      return;
    }

    if (!imapConfig?.sync || !imapConfig.realtimeImapChecking) {
      return;
    }

    const allowedIntervalIds = subscription.realtimeImapChecking;
    const selectedIntervalId = imapConfig.realtimeImapCheckingId;

    if (
      !selectedIntervalId ||
      !allowedIntervalIds.includes(selectedIntervalId)
    ) {
 
      return;
    }

    await this.createCronForUser(
      userId,
      imapConfig.realtimeImapChecking.cronTime,
    );
  }

  async createCronForUser(userId: string, cronTime: string) {
    const jobName = `sync_${userId}`;

    await this.stopCronForUser(userId);

    const job = new CronJob(cronTime, async () => {
      await this.runSyncJob(userId);
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();

  }

  async runSyncJob(userId: string) {
    const syncStartedAt = new Date();
    let syncHistoryId: string | null = null;

    try {
      console.log(`Running sync job for user ${userId}`);
      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
      });

      if (!imapConfig) return;

      // Create sync history record
      const syncHistory = await this.prisma.imapSyncHistory.create({
        data: {
          imapConfigurationId: imapConfig.id,
          syncStartedAt,
          status: 'SUCCESS',
          syncType: 'CRON',
          invoicesFound: 0,
          invoicesCreated: 0,
        },
      });
      syncHistoryId = syncHistory.id;

      const lastSyncDate = imapConfig.lastSync || imapConfig.created_at;
      const newInvoices = await this.imapApisService.readEmailTransactionsSince(
        userId,
        lastSyncDate,
      );

      const syncCompletedAt = new Date();

      // Update sync history with results
      await this.prisma.imapSyncHistory.update({
        where: { id: syncHistoryId },
        data: {
          syncCompletedAt,
          status: 'SUCCESS',
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
      }
    } catch (error) {
      // Update sync history with error
      if (syncHistoryId) {
        await this.prisma.imapSyncHistory.update({
          where: { id: syncHistoryId },
          data: {
            syncCompletedAt: new Date(),
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        });
      }
    }
  }

  async stopCronForUser(userId: string) {
    const jobName = `sync_${userId}`;

    try {
      const job = this.schedulerRegistry.getCronJob(jobName);
      await job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Cron job ${jobName} stopped.`);
    } catch {
      console.log(`Cron job ${jobName} not found.`);
    }
  }
}
