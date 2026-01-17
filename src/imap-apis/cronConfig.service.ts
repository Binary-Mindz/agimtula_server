import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapApisService } from './imap-apis.service';
import { StripeService } from 'src/user-dashboard/payment/stripe.service';

@Injectable()
export class CronConfigService implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService,
    private imapApisService: ImapApisService,
    private stripeService: StripeService,
  ) {}

  async onModuleInit() {
    await this.initializeAllCronJobs();
   await this.setupTrialExpiryNotificationCron();
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
   await   job.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Cron job ${jobName} stopped.`);
    } catch (error) {
      console.log(`Cron job ${jobName} not found.`, error?.message || '');
    }
  }

  // Debug method to list all active cron jobs
  listAllCronJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    console.log('Active cron jobs:', Array.from(jobs.keys()));
    return Array.from(jobs.keys());
  }

  // Setup daily cron job to check trial expiry
 async setupTrialExpiryNotificationCron() {
    const jobName = 'trial_expiry_check';
    
    // Stop existing job if any
    try {
      const existingJob = this.schedulerRegistry.getCronJob(jobName);
     await existingJob.stop();
      this.schedulerRegistry.deleteCronJob(jobName);
    } catch {
      // Job doesn't exist, continue
    }

    // Run daily at 9 AM
    const job = new CronJob('0 9 * * *', async () => {
      await this.checkTrialExpiry();
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.schedulerRegistry.addCronJob(jobName, job as any);
    job.start();
    console.log('Trial expiry notification cron job started');
  }

  async checkTrialExpiry() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find trials expiring in 1 day or 3 days
      const expiringTrials = await this.prisma.userSubscriptionPlan.findMany({
        where: {
          isActive: true,
          expiredAt: {
            gte: now,
            lte: threeDaysFromNow,
          },
        },
        include: {
          user: {
            include: {
              email: true,
              profile: true,
            },
          },
          subscriptionPlanPaymentStatus: true,
        },
      });

      for (const subscription of expiringTrials) {
        const daysUntilExpiry = Math.ceil(
          (subscription.expiredAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if it's a trial (payment status not PAID)
        const isTrial = subscription.subscriptionPlanPaymentStatus?.paymentStatus !== 'PAID';
        
        if (isTrial && (daysUntilExpiry === 1 || daysUntilExpiry === 3)) {
          await this.sendTrialExpiryNotification(
            subscription.user,
            subscription,
            daysUntilExpiry
          );
        }
      }
    } catch (error) {
      console.error('Error checking trial expiry:', error);
    }
  }

  async sendTrialExpiryNotification(user: any, subscription: any, daysLeft: number) {
    try {
      if (!user.email?.email) return;

      const userName = user.profile?.firstName || 'User';
      const planName = subscription.planName || 'Premium Plan';
      
      // Generate Stripe payment link
      const paymentLink = await this.generateStripePaymentLink(user, subscription);

      const subject = daysLeft === 1 
        ? `⚠️ Your ${planName} trial expires tomorrow!`
        : `🔔 Your ${planName} trial expires in ${daysLeft} days`;

      const message = `
        Hi ${userName},
        
        Your ${planName} free trial will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.
        
        To continue enjoying all features including IMAP email sync, please upgrade to the full plan.
        
        Upgrade now: ${paymentLink}
        
        Features you'll lose after trial expires:
        • Automatic email invoice sync
        • IMAP configuration
        • Real-time notifications
        
        Don't miss out on seamless invoice management!
        
        Best regards,
        The Agimtula Team
      `;

      // Log notification (replace with actual email service)
      await Promise.resolve(console.log(`Trial expiry notification sent to ${user.email.email}:`, {
        subject,
        daysLeft,
        planName,
        paymentLink,
        message: message.trim()
      }));

      // TODO: Integrate with your email service
      // await this.emailService.sendEmail({
      //   to: user.email.email,
      //   subject,
      //   text: message,
      //   html: this.generateTrialExpiryEmailTemplate(userName, planName, daysLeft, paymentLink)
      // });

    } catch (error) {
      console.error(`Failed to send trial expiry notification to user ${user.id}:`, error);
    }
  }

  private async generateStripePaymentLink(user: any, subscription: any): Promise<string> {
    try {
      // Get the subscription plan details
      const subscriptionHistory = await this.prisma.userSubscriptionPlanHistory.findFirst({
        where: { UserId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscriptionHistory) {
        return `${process.env.FRONTEND_URL}/subscribe`;
      }

      // Find the plan pricing
      const planPricing = await this.prisma.packagePricing.findFirst({
        where: {
          subscriptionPlan: {
            planName: subscription.planName,
          },
          billingPeriod: subscriptionHistory.billingPeriod || 'MONTHLY',
        },
        include: {
          subscriptionPlan: true,
        },
      });

      if (!planPricing?.stripePriceId) {
        return `${process.env.FRONTEND_URL}/subscribe?plan=${subscription.planName}`;
      }

      // Create Stripe checkout session
      const session = await this.stripeService.createSubscriptionCheckout(
        planPricing.stripePriceId,
        user.email.email as string,
        {
          userId: user.id,
          planId: planPricing.subscriptionPlan.id,
          billingPeriod: subscriptionHistory.billingPeriod || 'MONTHLY',
          isTrialUpgrade: 'true',
        },
      );

      return session.url || `${process.env.FRONTEND_URL}/subscribe?plan=${subscription.planName}`;
    } catch (error) {
      console.error('Error generating Stripe payment link:', error);
      return `${process.env.FRONTEND_URL}/subscribe?plan=${subscription.planName}`;
    }
  }
}
