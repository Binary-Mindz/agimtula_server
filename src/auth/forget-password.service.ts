import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import * as bcrypt from 'bcrypt';
import { cResponseData } from 'src/common/cResponse';
import { RedisServiceService } from 'src/config/redis-service/redis-service.service';
import * as crypto from 'crypto';
import {
  NotFoundAppException,
  ValidationException,
} from 'src/common/app-exceptions';

@Injectable()
export class ForgetPasswordService {
  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
    private redis: RedisServiceService,
  ) { }

  private readonly FORG_PREFIX = 'forPas';
  private readonly CRYPTO_PREFIX = 'cryp';
  private readonly OTP_EXPIRATION = 300; // 5 minutes
  private readonly CRYPTO_EXPIRATION = 300; // 5 minutes

  /* ---------------- REDIS STORE ---------------- */
  private async storeRedis(
    key: string,
    value: string,
    type: 'CODE' | 'CRYPTO',
  ) {
    if (type === 'CODE') {
      await this.redis.set(
        `${this.FORG_PREFIX}_${key}`,
        value,
        'EX',
        this.OTP_EXPIRATION,
      );
    } else {
      await this.redis.set(
        `${this.CRYPTO_PREFIX}_${key}`,
        value,
        'EX',
        this.CRYPTO_EXPIRATION,
      );
    }
  }

  /* ---------------- HELPERS ---------------- */
  private generateCryptoToken(): string {
    return crypto.randomUUID();
  }

  private generateOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  /* ---------------- SEND OTP ---------------- */
  async sendForgetPassCode(dto: ForgetPassDto) {
    try {
      const { email } = dto;

      const user = await this.prisma.user.findFirst({
        where: { email: { email } },
      });

      if (!user) {
        throw new NotFoundAppException('User not found');
      }

      // ✅ delete old OTP if exists
      await this.redis.del(`${this.FORG_PREFIX}_${email}`);

      const otp = this.generateOtp();

      await this.storeRedis(email, otp.toString(), 'CODE');

      await this.mail.sendMail(
        email,
        'Forget Password Code',
        `
          <h3>AuthSystem</h3>
          <p>Your email verification code:</p>
          <h2>${otp}</h2>
          <p>This code is valid for 5 minutes.</p>
        `,
      );

      return cResponseData({
        message: 'Forget password code sent successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) throw error;

      console.error('Send forget password code error:', error);
      throw new HttpException(
        'Failed to send forget password code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* ---------------- VERIFY OTP ---------------- */
  async verifyForgetPassCode(data: ValidateForgetPass) {
    try {
      const redisCode = await this.redis.get(
        `${this.FORG_PREFIX}_${data.email}`,
      );
      const user = await this.prisma.user.findFirst({
        where: { email: { email: data.email } },
      });

      if (!user) {
        throw new NotFoundAppException('User not found');
      }

      if (!redisCode || redisCode !== data.verificationCode.toString()) {
        throw new ValidationException('Code invalid or expired');
      }

      // ✅ delete OTP after verify
      await this.redis.del(`${this.FORG_PREFIX}_${data.email}`);

      const cryptoToken = this.generateCryptoToken();

      // save crypto → userId
      await this.storeRedis(cryptoToken, user.id, 'CRYPTO');

      return cResponseData({
        message: 'Code verified successfully',
        data: {
          crypto: cryptoToken,
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundAppException ||
        error instanceof ValidationException
      ) {
        throw error;
      }

      console.error('Verify forget password code error:', error);
      throw new HttpException(
        'Failed to verify forget password code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* ---------------- CHANGE PASSWORD ---------------- */
  async changePassword(data: ResetPass, cryptoToken: string) {
    try {
      const userId = await this.redis.get(
        `${this.CRYPTO_PREFIX}_${cryptoToken}`,
      );

      if (!userId) {
        throw new ValidationException('Invalid or expired crypto token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundAppException('User not found');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // ✅ delete crypto after use
      await this.redis.del(`${this.CRYPTO_PREFIX}_${cryptoToken}`);

      return cResponseData({
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (
        error instanceof ValidationException ||
        error instanceof NotFoundAppException
      ) {
        throw error;
      }

      console.error('Change password error:', error);
      throw new HttpException(
        'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
