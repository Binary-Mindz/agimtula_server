import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { cResponseData } from 'src/common/cResponse';
import {
  GetIntervalTimes,
  ImapConfiguration,
} from './types/getInvoiceTime.type';
// import { SyncSettingsDto } from './dto/sync-settings.dto';
// import { UpdateConnectionDto } from './dto/update-connection.dto';

@Injectable()
export class ManageConnectionService {
  constructor(private prisma: PrismaService) {}

  // seleted invice auto sync data
  private async selectedInvoiceTimeSyncData(userId: string) {
    const selTime = await this.prisma.userSubscriptionPlan.findFirst({
      where: {
        UserId: userId,
        subscriptionPlanPaymentStatus: {
          paymentStatus: 'PAID',
        },
        expiredAt: {
          gte: new Date(Date.now()),
        },
      },
      select: {
        realtimeImapChecking: true,
      },
    });
    if (!selTime?.realtimeImapChecking) return [];
    return selTime?.realtimeImapChecking;
  }

  //get invice auto sync data
  async getInvoiceTimeSyncData(
    userId: string,
    seleteItem?: string | null,
  ): Promise<GetIntervalTimes[]> {
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
      seleteItem: seleteItem ? seleteItem == item.id : false,
    }));
  }

  // get Imap Configuration data to user
  async getImapConfiguration(userId: string) {
    const imapConfiguration: ImapConfiguration =
      await this.prisma.imapConfiguration.findFirst({
        where: {
          userId: userId,
        },
      });

    if (!imapConfiguration)
      return cResponseData({
        message: 'You have no Imap Configuration',
        data: {
          syncFrequency: await this.getInvoiceTimeSyncData(userId),
        },
      });

    const { realtimeImapCheckingId, ...plan } = imapConfiguration;
    const syncFrequency = await this.getInvoiceTimeSyncData(
      userId,
      realtimeImapCheckingId,
    );

    return cResponseData({
      message:
        'Connection successful! Your email is now connected and syncing.',
      data: { ...plan, syncFrequency },
    });
  }

  // Imap config data to user
  async setImapConfiguration(userId: string, dto: ImapEmailConnectionDto) {
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

    const c = await this.prisma.imapConfiguration.upsert({
      where: {
        userId: userId,
      },
      update: {
        username: dto.imap_username,
        password: dto.imap_app_password,
        host: dto.imap_server,
        port: dto.imap_port,
        realtimeImapCheckingId: dto.realtimeImapCheckingId,
        sync: dto.automatic_Sync,
        emailNotifications: dto.emailNotifications,
      },
      create: {
        username: dto.imap_username,
        password: dto.imap_app_password,
        host: dto.imap_server,
        port: dto.imap_port,
        realtimeImapCheckingId: dto.realtimeImapCheckingId,
        connect: true,
        sync: dto.automatic_Sync,
        emailNotifications: dto.emailNotifications,
        userId: userId,
      },
    });

    return cResponseData({
      message:
        'Connection successful! Your email is now connected and syncing.',
      data: c,
    });
  }

  async imap_DisConnect(userId: string) {
    const disconnect = await this.prisma.imapConfiguration.update({
      where: {
        userId: userId,
      },
      data: {
        connect: false,
        sync: false,
        emailNotifications: false,
      },
    });
    return cResponseData({
      message: 'Imap Disconnected',
      data: disconnect,
    });
  }
}
