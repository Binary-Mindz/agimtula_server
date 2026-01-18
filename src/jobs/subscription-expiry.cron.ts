import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';
import { StripeService } from 'src/user-dashboard/payment/stripe.service';

@Injectable()
export class SubscriptionExpiryCron {
  private readonly logger = new Logger(SubscriptionExpiryCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: SmtpMailService,
    private readonly activityLog: ActivityLogService,
    private readonly stripeService: StripeService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async manageSubscriptions() {
    await Promise.all([
      this.activateFreeTrial(),
      this.enableSubscriptionFeatures(),
      this.checkNearExpiry(),
    ]);
  }

  private async enableSubscriptionFeatures() {
    try {
      const activeSubscriptions = await this.prisma.userSubscriptionPlan.findMany({
        where: {
          isActive: true,
          expiredAt: { gt: new Date() }
        }
      });

      for (const subscription of activeSubscriptions) {
        // Enable IMAP sync for active subscriptions
        await this.prisma.imapConfiguration.updateMany({
          where: { userId: subscription.UserId },
          data: { 
            sync: true,
            connect: true,
            connectionStatus: 'CONNECTED'
          }
        });
      }

      this.logger.log(`Enabled features for ${activeSubscriptions.length} active subscriptions`);
    } catch (error) {
      this.logger.error('Error enabling subscription features:', error);
    }
  }

  private async checkNearExpiry() {
    try {
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      const nearExpirySubscriptions = await this.prisma.userSubscriptionPlan.findMany({
        where: {
          isActive: true,
          expiredAt: { 
            gte: new Date(),
            lte: oneDayFromNow 
          }
        },
        include: {
          user: {
            include: {
              email: true,
              profile: true
            }
          }
        }
      });

      for (const subscription of nearExpirySubscriptions) {
        await this.sendExpirationWarning(subscription);
      }

      if (nearExpirySubscriptions.length > 0) {
        this.logger.log(`Sent urgent warnings to ${nearExpirySubscriptions.length} users`);
      }
    } catch (error) {
      this.logger.error('Error checking near expiry:', error);
    }
  }

  private async activateFreeTrial() {
    try {
      // Find users with free trial who haven't had any subscription before
      const freeTrialUsers = await this.prisma.userSubscriptionPlanHistory.findMany({
        where: {
          freeTrialDays: { gt: 0 },
          subscriptionPlanPaymentStatus: {
            paymentStatus: 'PENDING'
          },
          UserId: {
            notIn: await this.prisma.userSubscriptionPlan.findMany({
              select: { UserId: true }
            }).then(plans => plans.map(p => p.UserId))
          }
        },
        include: {
          user: {
            include: {
              email: true,
              profile: true
            }
          },
          subscriptionPlanPaymentStatus: true
        }
      });

      for (const history of freeTrialUsers) {
        const trialDays = history.freeTrialDays || 0;
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        // Create active subscription for trial period
        await this.prisma.userSubscriptionPlan.create({
          data: {
            UserId: history.UserId,
            planName: history.planName,
            isLimitedInvoicePerMonth: history.isLimitedInvoicePerMonth,
            perMonthInvoiceCount: history.perMonthInvoiceCount,
            realtimeImapChecking: history.realtimeImapChecking,
            isActive: true,
            expiredAt: trialEndDate,
            subscriptionPlanPaymentStatusId: history.subscriptionPlanPaymentStatus?.id || '',
            price: 0, // Free during trial
          }
        });

        // Enable all features during trial
        await this.prisma.imapConfiguration.updateMany({
          where: { userId: history.UserId },
          data: { 
            sync: true,
            connect: true,
            connectionStatus: 'CONNECTED'
          }
        });

        await this.activityLog.log({
          userId: history.UserId,
          type: 'FREE_TRIAL_ACTIVATED',
          title: `Free trial activated for ${history.planName} (${trialDays} days)`,
          category: 'USER',
        });

        this.logger.log(`Free trial activated for user ${history.UserId}`);
      }
    } catch (error) {
      this.logger.error('Error activating free trials:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Europe/Amsterdam',
  })
  async deactivateExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await this.prisma.userSubscriptionPlan.findMany({
      where: {
        expiredAt: { lte: now },
        isActive: true,
      },
      include: {
        user: {
          include: {
            email: true,
            profile: true
          }
        }
      }
    });

    for (const subscription of expiredSubscriptions) {
      // Disable subscription
      await this.prisma.userSubscriptionPlan.update({
        where: { id: subscription.id },
        data: { isActive: false }
      });

      // Disable IMAP sync
      await this.prisma.imapConfiguration.updateMany({
        where: { userId: subscription.UserId },
        data: { 
          sync: false,
          connect: false,
          connectionStatus: 'FAILED'
        }
      });

      // Send payment notification
      await this.sendPaymentNotification(subscription);

      await this.activityLog.log({
        userId: subscription.UserId,
        type: 'SUBSCRIPTION_EXPIRED',
        title: `Subscription expired: ${subscription.planName}`,
        category: 'SYSTEM',
        level: 'WARNING',
      });
    }

    if (expiredSubscriptions.length > 0) {
      this.logger.log(
        `Deactivated ${expiredSubscriptions.length} expired subscriptions at midnight`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendExpirationWarnings() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const expiringSubscriptions = await this.prisma.userSubscriptionPlan.findMany({
        where: {
          isActive: true,
          expiredAt: { 
            gte: new Date(),
            lte: threeDaysFromNow 
          }
        },
        include: {
          user: {
            include: {
              email: true,
              profile: true
            }
          }
        }
      });

      for (const subscription of expiringSubscriptions) {
        await this.sendExpirationWarning(subscription);
      }

      if (expiringSubscriptions.length > 0) {
        this.logger.log(`Sent expiration warnings to ${expiringSubscriptions.length} users`);
      }
    } catch (error) {
      this.logger.error('Error sending expiration warnings:', error);
    }
  }

  private async sendPaymentNotification(subscription: any) {
    try {
      // Get the original plan details for payment
      const planHistory = await this.prisma.userSubscriptionPlanHistory.findFirst({
        where: { UserId: subscription.UserId },
        orderBy: { createdAt: 'desc' },
        include: { subscriptionPlanPaymentStatus: true }
      });

      if (!planHistory) {
        this.logger.error(`No plan history found for user ${subscription.UserId}`);
        return;
      }

      // Get plan pricing for Stripe
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: { planName: subscription.planName },
        include: {
          packagePricing: {
            where: { billingPeriod: planHistory.billingPeriod }
          }
        }
      });

      if (!plan?.packagePricing[0]) {
        this.logger.error(`No pricing found for plan ${subscription.planName}`);
        return;
      }

      const pricing = plan.packagePricing[0];
      
      // Create Stripe checkout session
      const session = await this.stripeService.createSubscriptionCheckout(
        pricing.stripePriceId,
        subscription.user.email?.email as string,
        {
          userId: subscription.UserId,
          planId: plan.id,
          historyId: planHistory.id,
          billingPeriod: planHistory.billingPeriod,
        },
      );

      const paymentLink = session.url!;
      const userName = subscription.user.profile 
        ? `${subscription.user.profile.firstName} ${subscription.user.profile.lastName}`
        : 'User';

      // Check if this was a trial subscription
      const wasTrial = subscription.price === 0;
      const subject = wasTrial ? 'Free Trial Ended - Subscribe Now' : 'Subscription Expired - Renew Now';
      const headerText = wasTrial ? 'Free Trial Ended' : 'Subscription Expired';
      const bodyText = wasTrial 
        ? 'Your free trial has ended. Subscribe now to continue using our services:'
        : 'Your subscription has expired. Renew now to continue using our services:';

      await this.mailer.sendMail(
        subscription.user.email?.email as string,
        subject,
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">${headerText}</h2>
          <p>Hi ${userName},</p>
          <p>${bodyText}</p>
          <p><strong>${subscription.planName}</strong></p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" 
               style="background-color: #3498db; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              ${wasTrial ? 'Subscribe Now' : 'Renew Subscription'}
            </a>
          </div>
          <p>Features disabled until ${wasTrial ? 'subscription' : 'renewal'}:</p>
          <ul>
            <li>IMAP email sync</li>
            <li>Invoice processing</li>
            <li>Premium features</li>
          </ul>
          <p>Thank you for ${wasTrial ? 'trying' : 'using'} our service!</p>
        </div>
        `
      );
    } catch (error) {
      this.logger.error('Error sending payment notification:', error);
    }
  }

  private async sendExpirationWarning(subscription: any) {
    const paymentLink = `${process.env.FRONTEND_URL}/payment?plan=${subscription.planName}`;
    const userName = subscription.user.profile 
      ? `${subscription.user.profile.firstName} ${subscription.user.profile.lastName}`
      : 'User';

    const daysLeft = Math.ceil(
      (subscription.expiredAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    await this.mailer.sendMail(
      subscription.user.email?.email as string,
      `Subscription Expiring in ${daysLeft} Days`,
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f39c12;">Subscription Expiring Soon</h2>
        <p>Hi ${userName},</p>
        <p>Your <strong>${subscription.planName}</strong> subscription expires in <strong>${daysLeft} days</strong>.</p>
        <p>Renew now to avoid service interruption:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background-color: #27ae60; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Renew Now
          </a>
        </div>
        <p>Thank you for using our service!</p>
      </div>
      `
    );
  }

  private async sendUrgentExpirationWarning(subscription: any) {
    const paymentLink = `${process.env.FRONTEND_URL}/payment?plan=${subscription.planName}`;
    const userName = subscription.user.profile 
      ? `${subscription.user.profile.firstName} ${subscription.user.profile.lastName}`
      : 'User';

    await this.mailer.sendMail(
      subscription.user.email?.email as string,
      'URGENT: Subscription Expires Tomorrow!',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">⚠️ URGENT: Subscription Expires Tomorrow!</h2>
        <p>Hi ${userName},</p>
        <p>Your <strong>${subscription.planName}</strong> subscription expires <strong>tomorrow</strong>!</p>
        <p>Renew immediately to avoid service interruption:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background-color: #e74c3c; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            RENEW NOW
          </a>
        </div>
        <p><strong>Services will be disabled after expiration:</strong></p>
        <ul>
          <li>IMAP email sync</li>
          <li>Invoice processing</li>
          <li>All premium features</li>
        </ul>
        <p>Don't lose access - renew today!</p>
      </div>
      `
    );
  }
}
