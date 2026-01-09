import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SubscriptionExpiryCron {
  private readonly logger = new Logger(SubscriptionExpiryCron.name);

  constructor(private readonly prisma: PrismaService) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Europe/Amsterdam',
  })
  async deactivateExpiredSubscriptions() {
    const now = new Date();

    const result = await this.prisma.userSubscriptionPlan.updateMany({
      where: {
        expiredAt: {
          lte: now,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `Deactivated ${result.count} expired subscriptions at midnight`,
      );
    }
  }
}
