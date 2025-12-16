import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class TwoFACleanupCron {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    const fifteenMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    await this.prisma.twoFA.deleteMany({
      where: {
        createdAt: {
          lt: fifteenMinutesAgo,
        },
      },
    });

  }
}
