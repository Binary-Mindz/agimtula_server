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

    console.log(
      `Initialized cron jobs for ${activeSubscriptions.length} users`,
    );
  }

  async setupCronForUser(userId: string) {
    const subscription = await this.prisma.userSubscriptionPlan.findUnique({
      where: { UserId: userId, isActive: true },
    });

    if (!subscription) {
      console.log(`No active subscription for user ${userId}`);
      return;
    }

    const imapConfig = await this.prisma.imapConfiguration.findUnique({
      where: { userId },
      include: { realtimeImapChecking: true },
    });

    if (!imapConfig?.sync || !imapConfig.realtimeImapChecking) {
      console.log(`Sync disabled or no interval set for user ${userId}`);
      return;
    }

    const allowedIntervals = subscription.realtimeImapChecking;
    const selectedInterval = imapConfig.realtimeImapChecking.interval;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!allowedIntervals.includes(selectedInterval)) {
      console.log(
        `Interval ${selectedInterval} not allowed in subscription plan`,
      );
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

    console.log(`Cron job ${jobName} created with schedule: ${cronTime}`);
  }

  async runSyncJob(userId: string) {
    try {
      console.log(`Running sync job for user ${userId}`);
      const imapConfig = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
      });

      if (!imapConfig) return;

      const lastSyncDate = imapConfig.lastSync || imapConfig.created_at;
      await this.imapApisService.readEmailTransactionsSince(
        userId,
        lastSyncDate as Date,
      );

      await this.prisma.imapConfiguration.update({
        where: { userId },
        data: { lastSync: new Date() },
      });
    } catch (error) {
      console.error(`Sync job failed for user ${userId}:`, error);
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
