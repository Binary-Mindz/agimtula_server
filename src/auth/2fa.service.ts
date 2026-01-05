/* eslint-disable @typescript-eslint/no-unused-vars */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { EnableTwoFADto, VerifyTwoFADto } from './dto/two-fa.dto';
import { cResponseData } from 'src/common/cResponse';
import { RedisServiceService } from 'src/config/redis-service/redis-service.service';

interface TwoFARedisPayload {
  code: number;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class TwoFAService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: SmtpMailService,
    private readonly redis: RedisServiceService,
  ) {}


  private readonly TTL = 300; 
  private readonly MAX_ATTEMPTS = 5;

  private async setRedisValue<T>(key: string, value: T, ttl: number) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  private async getRedisValue<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  private generateCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  private getRedisKey(email: string, type: 'ENABLE' | 'DISABLE'): string {
    return `2fa:${type.toLowerCase()}:${email}`;
  }

  private async getUserOrFail(userId: string, email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        email: { email },
      },
    });

    if (!user) {
      throw new ForbiddenException('User and email do not match');
    }

    return user;
  }

  async sendTwoFACode(userId: string, dto: EnableTwoFADto) {
    try {
      const { email } = dto;
      const user = await this.getUserOrFail(userId, email);

      if (user.twoFactorEnabled) {
        throw new ForbiddenException('2FA is already enabled');
      }

      const redisKey = this.getRedisKey(email, 'ENABLE');
      let payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload) {
        payload = {
          code: this.generateCode(),
          attempts: 0,
          createdAt: Date.now(),
        };

        await this.setRedisValue(redisKey, payload, this.TTL);
      }

      await this.mail.sendMail(
        email,
        'Enable Two-Factor Authentication',
        `
        <h3>Enable Two-Factor Authentication</h3>
        <p>Your verification code:</p>
        <h2>${payload.code}</h2>
        <p>This code expires in 5 minutes.</p>
      `,
      );

      return cResponseData({
        message: '2FA code sent successfully',
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to send 2FA code',
      });
    }
  }

  async verifyAndEnableTwoFA(userId: string, dto: VerifyTwoFADto) {
    try {
      const { email, code } = dto;
      await this.getUserOrFail(userId, email);

      const redisKey = this.getRedisKey(email, 'ENABLE');
      const payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload) {
        throw new ForbiddenException('Verification code expired');
      }

      if (payload.attempts >= this.MAX_ATTEMPTS) {
        await this.redis.del(redisKey);
        throw new ForbiddenException('Maximum attempts exceeded');
      }

      if (payload.code !== code) {
        payload.attempts += 1;
        await this.setRedisValue(redisKey, payload, this.TTL);
        throw new ForbiddenException('Invalid verification code');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });

      await this.redis.del(redisKey);

      return cResponseData({
        message: '2FA enabled successfully',
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to enable 2FA',
      });
    }
  }

  async sendDisableTwoFACode(userId: string, dto: EnableTwoFADto) {
    try {
      const { email } = dto;
      const user = await this.getUserOrFail(userId, email);

      if (!user.twoFactorEnabled) {
        throw new ForbiddenException('2FA is not enabled');
      }

      const redisKey = this.getRedisKey(email, 'DISABLE');
      let payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload) {
        payload = {
          code: this.generateCode(),
          attempts: 0,
          createdAt: Date.now(),
        };

        await this.setRedisValue(redisKey, payload, this.TTL);
      }

      await this.mail.sendMail(
        email,
        'Disable Two-Factor Authentication',
        `
        <h3>Disable Two-Factor Authentication</h3>
        <p>Your verification code:</p>
        <h2>${payload.code}</h2>
        <p>This code expires in 5 minutes.</p>
      `,
      );

      return cResponseData({
        message: 'Disable 2FA code sent successfully',
      });
    } catch (error) {
      return cResponseData({
        message:'Failed to send disable 2FA code',
      });
    }
  }

  async verifyAndDisableTwoFA(userId: string, dto: VerifyTwoFADto) {
    try {
      const { email, code } = dto;
      await this.getUserOrFail(userId, email);

      const redisKey = this.getRedisKey(email, 'DISABLE');
      const payload = await this.getRedisValue<TwoFARedisPayload>(redisKey);

      if (!payload || payload.code !== code) {
        throw new ForbiddenException('Invalid or expired verification code');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      });

      await this.redis.del(redisKey);

      return cResponseData({
        message: '2FA disabled successfully',
      });
    } catch (error) {
      return cResponseData({
        message: 'Failed to disable 2FA',
      });
    }
  }
}
