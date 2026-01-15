import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { EnableTwoFADto, VerifyTwoFADto } from './dto/two-fa.dto';
import { cResponseData } from 'src/common/cResponse';
import { RedisServiceService } from 'src/config/redis-service/redis-service.service';
import { ConflictAppException, ValidationException } from 'src/common/app-exceptions';

interface TwoFARedisPayload {
  code: number;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class TwoFAService {
  private readonly logger = new Logger(TwoFAService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: SmtpMailService,
    private readonly redis: RedisServiceService,
  ) {}

  private readonly TTL = 300;
  private readonly MAX_ATTEMPTS = 5;

  private async setRedisValue<T>(key: string, value: T, ttl: number) {
    this.logger.debug(`Setting redis key: ${key}`);
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  private async getRedisValue<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    this.logger.debug(
      data ? `Redis hit for key: ${key}` : `Redis miss for key: ${key}`,
    );
    return data ? (JSON.parse(data) as T) : null;
  }

  private generateCode(): number {
    this.logger.debug('Generating 2FA code');
    return Math.floor(100000 + Math.random() * 900000);
  }

  private getRedisKey(email: string, type: 'ENABLE' | 'DISABLE'): string {
    return `2fa:${type.toLowerCase()}:${email}`;
  }

  private async getUserOrFail(userId: string, email: string) {
    this.logger.debug(`Validating user/email match for ${email}`);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, email: { email } },
    });
    if (!user) {
      this.logger.warn(
        `User/email mismatch (userId=${userId}, email=${email})`,
      );
      throw new ValidationException('User and email do not match');
    }
    return user;
  }

  async sendTwoFACode(userId: string, dto: EnableTwoFADto) {
    try {
      if (!userId) {
        throw new ValidationException('User ID is required');
      }

      const { email } = dto;
      this.logger.log(`Send enable-2FA code request for ${email}`);

      const user = await this.getUserOrFail(userId, email);
      if (user.twoFactorEnabled) {
        this.logger.warn(`2FA already enabled for userId=${userId}`);
        throw new ConflictAppException('2FA is already enabled');
      }

      const redisKey = this.getRedisKey(email, 'ENABLE');
      let payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload) {
        this.logger.log(`Creating new enable-2FA payload for ${email}`);
        payload = {
          code: this.generateCode(),
          attempts: 0,
          createdAt: Date.now(),
        };
        await this.setRedisValue(redisKey, payload, this.TTL);
      } else {
        this.logger.log(`Reusing existing enable-2FA payload for ${email}`);
      }

      await this.mail.sendMail(
        email,
        'Enable Two-Factor Authentication',
        `<h3>Enable Two-Factor Authentication</h3>
         <p>Your verification code:</p>
         <h2>${payload.code}</h2>
         <p>This code expires in 5 minutes.</p>`,
      );

      this.logger.log(`Enable-2FA code sent to ${email}`);
      return cResponseData({ message: '2FA code sent successfully' });
    } catch (error) {
      if (
        error instanceof ConflictAppException ||
        error instanceof ValidationException
      )
        throw error;
      this.logger.error('Send enable 2FA code error', error.stack);
      throw new HttpException(
        'Failed to send 2FA code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async verifyTwoFA(userId: string, dto: VerifyTwoFADto) {
    try {
      if (!userId) {
        throw new ValidationException('User ID is required');
      }

      const { email, code } = dto;
      this.logger.log(`Verify 2FA request for ${email}`);

      // Ensure user exists
      await this.getUserOrFail(userId, email);

      // 🔍 Check current 2FA status from DB
      const isEnabled = await this.isTwoFAEnabled(userId);

      const action: 'ENABLE' | 'DISABLE' = isEnabled ? 'DISABLE' : 'ENABLE';
      const redisKey = this.getRedisKey(email, action);

      const payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload) {
        this.logger.warn(`2FA verification code expired for ${email}`);
        throw new ValidationException('Verification code expired');
      }

      if (payload.attempts >= this.MAX_ATTEMPTS) {
        this.logger.warn(`Max 2FA attempts exceeded for ${email}`);
        await this.redis.del(redisKey);
        throw new ValidationException('Maximum attempts exceeded');
      }

      if (payload.code !== code) {
        payload.attempts += 1;

        await this.setRedisValue(redisKey, payload, this.TTL);

        this.logger.warn(
          `Invalid 2FA code attempt ${payload.attempts} for ${email}`,
        );

        throw new ValidationException('Invalid verification code');
      }

      // ✅ Update DB
      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: !isEnabled },
      });

      // 🧹 Cleanup Redis
      await this.redis.del(redisKey);

      this.logger.log(
        `2FA ${!isEnabled ? 'enabled' : 'disabled'} successfully for userId=${userId}`,
      );

      return cResponseData({
        message: !isEnabled
          ? '2FA enabled successfully'
          : '2FA disabled successfully',
      });
    } catch (error) {
      if (error instanceof ValidationException) {
        throw error;
      }

      this.logger.error('Verify 2FA error', error.stack);
      throw new HttpException(
        'Failed to verify 2FA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async isTwoFAEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      throw new ValidationException('User not found');
    }

    return user.twoFactorEnabled;
  }

  // async sendDisableTwoFACode(userId: string, dto: EnableTwoFADto) {
  //   try {
  //     if (!userId) {
  //       throw new ValidationException('User ID is required');
  //     }

  //     const { email } = dto;
  //     this.logger.log(`Send disable-2FA code request for ${email}`);

  //     const user = await this.getUserOrFail(userId, email);
  //     if (!user.twoFactorEnabled) {
  //       this.logger.warn(`2FA not enabled for userId=${userId}`);
  //       throw new ConflictAppException('2FA is not enabled');
  //     }

  //     const redisKey = this.getRedisKey(email, 'DISABLE');
  //     let payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

  //     if (!payload) {
  //       this.logger.log(`Creating new disable-2FA payload for ${email}`);
  //       payload = { code: this.generateCode(), attempts: 0, createdAt: Date.now() };
  //       await this.setRedisValue(redisKey, payload, this.TTL);
  //     }

  //     await this.mail.sendMail(
  //       email,
  //       'Disable Two-Factor Authentication',
  //       `<h3>Disable Two-Factor Authentication</h3>
  //        <p>Your verification code:</p>
  //        <h2>${payload.code}</h2>
  //        <p>This code expires in 5 minutes.</p>`
  //     );

  //     this.logger.log(`Disable-2FA code sent to ${email}`);
  //     return cResponseData({ message: 'Disable 2FA code sent successfully' });
  //   } catch (error) {
  //     if (error instanceof ConflictAppException || error instanceof ValidationException) throw error;
  //     this.logger.error('Send disable 2FA code error', error.stack);
  //     throw new HttpException('Failed to send disable 2FA code', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  // async verifyAndDisableTwoFA(userId: string, dto: VerifyTwoFADto) {
  //   try {
  //     if (!userId) {
  //       throw new ValidationException('User ID is required');
  //     }

  //     const { email, code } = dto;
  //     this.logger.log(`Verify disable-2FA request for ${email}`);
  //     await this.getUserOrFail(userId, email);

  //     const redisKey = this.getRedisKey(email, 'DISABLE');
  //     const payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

  //     if (!payload || payload.code !== code) {
  //       this.logger.warn(`Invalid/expired disable-2FA code for ${email}`);
  //       throw new ValidationException('Invalid or expired verification code');
  //     }

  //     await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false } });
  //     await this.redis.del(redisKey);

  //     this.logger.log(`2FA disabled successfully for userId=${userId}`);
  //     return cResponseData({ message: '2FA disabled successfully' });
  //   } catch (error) {
  //     if (error instanceof ValidationException) throw error;
  //     this.logger.error('Verify and disable 2FA error', error.stack);
  //     throw new HttpException('Failed to disable 2FA', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }
}
