import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { cResponseData } from 'src/common/cResponse';
import { SyncSettingsDto } from './dto/sync-settings.dto';

@Injectable()
export class ManageConnectionService {
  constructor(private prisma: PrismaService) {}

  async userSubscription(userId: string, dto: ImapEmailConnectionDto) {
    const subscription = await this.prisma.userSubscriptionPlan.findFirst({
      where: {
        UserId: userId,
      },
      include: {
        subscriptionPlanPaymentStatus: true,
      },
    });

    if (!subscription) {
      throw new ForbiddenException("You're not a subscriber");
    }

    const isExpired = subscription.expiredAt < new Date(Date.now());

    if (isExpired) {
      throw new ForbiddenException('Your subscription is expired');
    }

    if (subscription.subscriptionPlanPaymentStatus?.paymentStatus !== 'PAID') {
      throw new ForbiddenException("You Haven't paid yet");
    }

    await this.prisma.imapConfiguration.create({
      data: {
        host: dto.imap_server,
        port: dto.imap_port,
        username: dto.imap_username,
        password: dto.imap_app_password,
        userId,
      },
    });

    return cResponseData({
      message:
        'Connection successful! Your email is now connected and syncing.',
    });
  }

  async syncSettings(userId: string, dto: SyncSettingsDto) {
    const isImapConfigured = await this.prisma.imapConfiguration.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!isImapConfigured) {
      throw new ForbiddenException('IMAP is not configured for this user');
    }

    const interval = await this.prisma.invoiceAutoSyncInterval.findUnique({
      where: { id: dto.syncFrequency },
    });

    if (!interval) {
      throw new BadRequestException('Invalid sync frequency');
    }

    await this.prisma.imapConfiguration.update({
      where: {
        userId: userId,
      },
      data: {
        sync: dto.automaticSync,
        realtimeImapCheckingId: dto.syncFrequency,
      },
    });

    return cResponseData({
      message: 'Synchronization settings updated successfully',
    });
  }
}
