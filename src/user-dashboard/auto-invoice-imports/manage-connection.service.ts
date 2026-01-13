import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { cResponseData } from 'src/common/cResponse';
import {
  GetIntervalTimes,
  ImapConfiguration,
} from './types/getInvoiceTime.type';
import { ValidationException } from 'src/common/app-exceptions';

@Injectable()
export class ManageConnectionService {
  constructor(private prisma: PrismaService) {}

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

  async getImapConfiguration(userId: string) {
    try {
      const imapConfiguration: ImapConfiguration =
        await this.prisma.imapConfiguration.findFirst({
          where: {
            userId: userId,
          },
        });

      if (!imapConfiguration) {
        return cResponseData({
          success: true,
          message: 'No IMAP configuration found',
          data: {
            syncFrequency: await this.getInvoiceTimeSyncData(userId),
          },
        });
      }

      const { realtimeImapCheckingId, ...plan } = imapConfiguration;
      const syncFrequency = await this.getInvoiceTimeSyncData(
        userId,
        realtimeImapCheckingId,
      );

      return cResponseData({
        success: true,
        message: 'IMAP configuration retrieved successfully',
        data: { ...plan, syncFrequency },
      });
    } catch (error) {
      console.error('Get IMAP configuration error:', error);
      throw new HttpException(
        'Failed to retrieve IMAP configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async setImapConfiguration(userId: string, dto: ImapEmailConnectionDto) {
    try {
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
        throw new ValidationException('Active subscription required');
      }

      const isExpired = subscription.expiredAt < new Date(Date.now());
      if (isExpired) {
        throw new ValidationException('Subscription expired');
      }

      const imapConnectService = {};
      if (dto.connect === false) {
        imapConnectService['connect'] = false;
        imapConnectService['sync'] = false;
        imapConnectService['emailNotifications'] = false;
      }
      if (dto.connect === true) {
        imapConnectService['connect'] = true;
        imapConnectService['sync'] = dto.automatic_Sync || false;
        imapConnectService['emailNotifications'] =
          dto.emailNotifications || false;
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
          realtimeImapCheckingId: dto.realtimeImapCheckingId || null,
          ...imapConnectService,
        },
        create: {
          username: dto.imap_username,
          password: dto.imap_app_password,
          host: dto.imap_server,
          port: dto.imap_port,
          realtimeImapCheckingId: dto.realtimeImapCheckingId || null,
          userId: userId,
          ...imapConnectService,
        },
      });

      if (dto.connect == null && c.connect == true) {
        const cUp = await this.prisma.imapConfiguration.update({
          where: {
            userId: userId,
          },
          data: {
            sync: dto.automatic_Sync,
            emailNotifications: dto.emailNotifications,
          },
        });
        return cResponseData({
          success: true,
          message: 'IMAP configuration updated successfully',
          data: cUp,
        });
      }

      return cResponseData({
        success: true,
        message: 'IMAP configuration saved successfully',
        data: c,
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }
      console.error('Set IMAP configuration error:', error);
      throw new HttpException(
        'Failed to save IMAP configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async imap_DisConnect(userId: string) {
    try {
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
        success: true,
        message: 'IMAP disconnected successfully',
        data: disconnect,
      });
    } catch (error) {
      console.error('IMAP disconnect error:', error);
      throw new HttpException(
        'Failed to disconnect IMAP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
