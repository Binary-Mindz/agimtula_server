import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapApisService } from '../imap-apis/imap-apis.service';
import { Invoice, SyncInterval } from 'prisma/generated/prisma/client';
import { CronConfigService } from '../imap-apis/cronConfig.service';

@Injectable()
export class ImapSyncService {
  constructor(
    private prisma: PrismaService,
    private imapApisService: ImapApisService,
    private cronConfigService: CronConfigService,
  ) {}

  async syncEmails(userId: string): Promise<Invoice[]> {
    const imapConfig = await this.prisma.imapConfiguration.findFirst({
      where: { userId },
    });

    if (!imapConfig) {
      throw new Error('IMAP configuration not found');
    }

    // Get last sync date or use config creation date
    const lastSyncDate = imapConfig.lastSync || imapConfig.created_at;

    console.log('Syncing emails since:', lastSyncDate);
    console.log('Current time:', new Date());

    // Fetch emails since last sync
    const newInvoices = await this.imapApisService.readEmailTransactionsSince(
      userId,
      lastSyncDate as Date,
    );

    console.log('Found invoices:', newInvoices.length);

    // Only update last sync time if we actually processed emails
    if (newInvoices.length > 0) {
      await this.prisma.imapConfiguration.update({
        where: { userId },
        data: { lastSync: new Date() },
      });
    }

    return newInvoices;
  }

  async getLastSyncInfo(userId: string) {
    const imapConfig = await this.prisma.imapConfiguration.findFirst({
      where: { userId },
      select: {
        lastSync: true,
        created_at: true,
        sync: true,
      },
    });

    return {
      lastSync: imapConfig?.lastSync,
      configCreated: imapConfig?.created_at,
      syncEnabled: imapConfig?.sync,
    };
  }

  async resetLastSync(userId: string) {
    await this.prisma.imapConfiguration.update({
      where: { userId },
      data: { lastSync: null },
    });
    return { message: 'Last sync reset' };
  }

  async setSyncInterval(userId: string, interval: SyncInterval) {
    const subscription = await this.prisma.userSubscriptionPlan.findUnique({
      where: { UserId: userId, isActive: true },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (!subscription.realtimeImapChecking.includes(interval)) {
      throw new Error('Selected interval not available in your subscription plan');
    }

    const cronMap = {
      [SyncInterval.DAILY]: '0 0 * * *',
      [SyncInterval.HOURLY]: '0 * * * *',
      [SyncInterval.EVERY_15_MINUTES]: '*/15 * * * *',
    };

    const intervalData = {
      [SyncInterval.DAILY]: { title: 'Daily Sync', description: 'Sync emails daily' },
      [SyncInterval.HOURLY]: { title: 'Hourly Sync', description: 'Sync emails every hour' },
      [SyncInterval.EVERY_15_MINUTES]: { title: '15 Min Sync', description: 'Sync emails every 15 minutes' },
    };

    const syncInterval = await this.prisma.invoiceAutoSyncInterval.upsert({
      where: { id: `${userId}-${interval}` },
      create: {
        id: `${userId}-${interval}`,
        title: intervalData[interval].title,
        description: intervalData[interval].description,
        interval,
        cronTime: cronMap[interval],
      },
      update: {
        interval,
        cronTime: cronMap[interval],
      },
    });

    await this.prisma.imapConfiguration.update({
      where: { userId },
      data: { realtimeImapCheckingId: syncInterval.id },
    });

    await this.cronConfigService.setupCronForUser(userId);

    return { interval, cron: cronMap[interval] };
  }
}
