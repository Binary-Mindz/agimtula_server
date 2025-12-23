import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { cResponseData } from 'src/common/cResponse';
// import { SyncSettingsDto } from './dto/sync-settings.dto';
// import { UpdateConnectionDto } from './dto/update-connection.dto';

@Injectable()
export class ManageConnectionService {
  constructor(private prisma: PrismaService) {}

  //get invice auto sync data
  async invoiceTimeSyncData(userId: string) {
    const seletedTime = await this.selectedInvoiceTimeSyncData(userId);
    const intervalTimeSync = await this.prisma.invoiceAutoSyncInterval.findMany(
      {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
    );
    return intervalTimeSync.map((item) => ({
      ...item,
      selected: seletedTime?.includes(item.id),
    }));
  }

  // seleted invice auto sync data
  async selectedInvoiceTimeSyncData(userId: string) {
    const selTime = await this.prisma.userSubscriptionPlan.findFirst({
      where: {
        UserId: userId,
        subscriptionPlanPaymentStatus: {
          paymentStatus: 'PAID',
        },
      },
      select: {
        realtimeImapChecking: true,
      },
    });
    if (!selTime?.realtimeImapChecking) return [];
    return selTime?.realtimeImapChecking;
  }

  // Imap config data to user
  async imapConfiguration(userId: string, dto: ImapEmailConnectionDto) {
    const subscription = await this.prisma.userSubscriptionPlan.findFirst({
      where: {
        UserId: userId,
        subscriptionPlanPaymentStatus: {
          paymentStatus: 'PAID',
        },
      },
      include: {
        subscriptionPlanPaymentStatus: true,
      },
    });

    if (!subscription) {
      throw new HttpException(
        cResponseData({
          message: 'You have no subscription plan',
        }),
        400,
      );
    }

    const isExpired = subscription.expiredAt < new Date(Date.now());
    if (isExpired) {
      throw new HttpException(
        cResponseData({
          message: 'Your subscription plan is expired',
        }),
        400,
      );
    }

    // await this.prisma.imapConfiguration.create({
    //   data: {
    //     host: dto.imap_server,
    //     port: dto.imap_port,
    //     username: dto.imap_username,
    //     password: dto.imap_app_password,
    //     userId,
    //   },
    // });

    return cResponseData({
      message:
        'Connection successful! Your email is now connected and syncing.',
      data: subscription,
    });
  }
}
