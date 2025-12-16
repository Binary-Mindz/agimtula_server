import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ForgetCodeCleanupCron {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanExpiredCodes() {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);

    const deleted = await this.prisma.forgetPass.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    if (deleted.count > 0) {
      this.logger.log(`Deleted ${deleted.count} expired forget-password codes`);
    }
  }
}
