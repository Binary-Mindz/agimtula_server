import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class CleanupCronService {
  private readonly logger = new Logger(CleanupCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanExpiredCodes() {
    try {
      const now = new Date();

      // --- Clean ForgetPass codes older than 15 minutes ---
      const forgetPassCutoff = new Date(now.getTime() - 5 * 60 * 1000);
      const deletedForgetPass = await this.prisma.forgetPass.deleteMany({
        where: {
          createdAt: { lt: forgetPassCutoff },
        },
      });

      if (deletedForgetPass.count > 0) {
        this.logger.log(
          `Deleted ${deletedForgetPass.count} expired forget-password codes`,
        );
      }

      // --- Clean TwoFA codes older than 15 minutes ---
      const twoFACutoff = new Date(now.getTime() - 5 * 60 * 1000);
      const deletedTwoFA = await this.prisma.twoFA.deleteMany({
        where: {
          createdAt: { lt: twoFACutoff },
        },
      });

      if (deletedTwoFA.count > 0) {
        this.logger.log(`Deleted ${deletedTwoFA.count} expired 2FA codes`);
      }
    } catch (error) {
      this.logger.error('Error cleaning expired codes', error);
    }
  }
}
