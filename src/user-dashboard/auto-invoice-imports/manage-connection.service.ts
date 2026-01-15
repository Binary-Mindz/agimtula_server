import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { cResponseData } from 'src/common/cResponse';
import * as Imap from 'imap';
import {
  GetIntervalTimes,
  ImapConfiguration,
} from './types/getInvoiceTime.type';
import { ValidationException } from 'src/common/app-exceptions';
import { CronConfigService } from 'src/imap-apis/cronConfig.service';

@Injectable()
export class ManageConnectionService {
  constructor(
    private prisma: PrismaService,
    private cronConfigService: CronConfigService,
  ) {}

  private async testConnection(dto: ImapEmailConnectionDto) {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: dto.imap_username,
        password: dto.imap_app_password,
        host: dto.imap_server,
        port: dto.imap_port,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10_000,
        authTimeout: 10_000,
      });
      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(err);
      });

      imap.connect();
    });
  }

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
      if (error instanceof HttpException) {
        throw error;
      }
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

      let isConnected = false;

      if (dto.connect === true) {
        try {
          await this.testConnection(dto);
          isConnected = true;
        } catch (err: any) {
          console.error('IMAP test failed:', err?.message);
          isConnected = false;
        }
      }

      let validRealtimeId: string | null = null;
      if (dto.realtimeImapCheckingId) {
        const exists = await this.prisma.invoiceAutoSyncInterval.findUnique({
          where: { id: dto.realtimeImapCheckingId },
        });

        if (!exists) {
          // ❌ FK invalid → throw, do NOT save
          throw new HttpException(
            'Invalid realtimeImapCheckingId: must be a valid ID',
            HttpStatus.BAD_REQUEST,
          );
        }

        validRealtimeId = dto.realtimeImapCheckingId;
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
          realtimeImapCheckingId: validRealtimeId || null,
          connectionStatus: isConnected ? 'CONNECTED' : 'FAILED',
          ...imapConnectService,
          connect: isConnected ? true : false,
        },
        create: {
          username: dto.imap_username,
          password: dto.imap_app_password,
          host: dto.imap_server,
          port: dto.imap_port,
          realtimeImapCheckingId: validRealtimeId || null,
          connectionStatus: isConnected ? 'CONNECTED' : 'FAILED',
          userId: userId,
          ...imapConnectService,
          connect: isConnected ? true : false,
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

        // Setup cron job if sync is enabled
        if (dto.automatic_Sync && dto.realtimeImapCheckingId) {
          await this.cronConfigService.setupCronForUser(userId);
        }

        return cResponseData({
          success: true,
          message: 'IMAP configuration updated successfully',
          data: cUp,
        });
      }

      // Setup cron job if sync is enabled on create/update
      if (c.sync && c.realtimeImapCheckingId) {
        await this.cronConfigService.setupCronForUser(userId);
      }

      return cResponseData({
        success: true,
        message: 'IMAP configuration saved successfully',
        data: c,
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error; // keep 400-level errors
      }
      if (error instanceof HttpException) {
        throw error; // your explicit HttpExceptions
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
      const config = await this.prisma.imapConfiguration.findUnique({
        where: { userId },
      });

      if (!config) {
        throw new HttpException(
          'IMAP configuration not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const disconnect = await this.prisma.imapConfiguration.update({
        where: { userId },
        data: {
          connect: false,
          sync: false,
          emailNotifications: false,
        },
      });

      await this.cronConfigService.stopCronForUser(userId);

      return cResponseData({
        success: true,
        message: 'IMAP disconnected successfully',
        data: disconnect,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('IMAP disconnect error:', error);
      throw new HttpException(
        'Failed to disconnect IMAP',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
