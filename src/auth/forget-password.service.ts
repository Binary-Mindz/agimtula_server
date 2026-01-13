import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(ForgetPasswordService.name);

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
      this.logger.log(`Storing OTP in redis for email: ${key}`);
      await this.redis.set(
        `${this.FORG_PREFIX}_${key}`,
        value,
        'EX',
        this.OTP_EXPIRATION,
      );
    } else {
      this.logger.log(`Storing crypto token in redis`);
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
    this.logger.debug('Generating crypto token');
    return crypto.randomUUID();
  }

  private generateOtp(): number {
    this.logger.debug('Generating OTP');
    return Math.floor(100000 + Math.random() * 900000);
  }

  /* ---------------- SEND OTP ---------------- */
  async sendForgetPassCode(dto: ForgetPassDto) {
    try {
      const { email } = dto;
      this.logger.log(`Forget password request received for ${email}`);

      const user = await this.prisma.user.findFirst({
        where: { email: { email } },
      });

      if (!user) {
        this.logger.warn(`Forget password: user not found (${email})`);
        throw new NotFoundAppException('User not found');
      }

      // delete old OTP
      this.logger.log(`Deleting old OTP if exists for ${email}`);
      await this.redis.del(`${this.FORG_PREFIX}_${email}`);

      const otp = this.generateOtp();

      await this.storeRedis(email, otp.toString(), 'CODE');

      this.logger.log(`Sending forget password email to ${email}`);
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

      this.logger.log(`Forget password OTP sent successfully to ${email}`);

      return cResponseData({
        message: 'Forget password code sent successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) throw error;

      this.logger.error(
        'Send forget password code failed',
        error.stack,
      );

      throw new HttpException(
        'Failed to send forget password code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* ---------------- VERIFY OTP ---------------- */
  async verifyForgetPassCode(data: ValidateForgetPass) {
    try {
      this.logger.log(
        `Verifying OTP for email: ${data.email}`,
      );

      const redisCode = await this.redis.get(
        `${this.FORG_PREFIX}_${data.email}`,
      );

      const user = await this.prisma.user.findFirst({
        where: { email: { email: data.email } },
      });

      if (!user) {
        this.logger.warn(
          `OTP verification failed, user not found (${data.email})`,
        );
        throw new NotFoundAppException('User not found');
      }

      if (!redisCode || redisCode !== data.verificationCode.toString()) {
        this.logger.warn(
          `Invalid or expired OTP for ${data.email}`,
        );
        throw new ValidationException('Code invalid or expired');
      }

      // delete OTP
      this.logger.log(`OTP verified, deleting OTP for ${data.email}`);
      await this.redis.del(`${this.FORG_PREFIX}_${data.email}`);

      const cryptoToken = this.generateCryptoToken();

      await this.storeRedis(cryptoToken, user.id, 'CRYPTO');

      this.logger.log(
        `OTP verification successful for ${data.email}`,
      );

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

      this.logger.error(
        'Verify forget password code failed',
        error.stack,
      );

      throw new HttpException(
        'Failed to verify forget password code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /* ---------------- CHANGE PASSWORD ---------------- */
  async changePassword(data: ResetPass, cryptoToken: string) {
    try {
      this.logger.log('Password reset request received');

      const userId = await this.redis.get(
        `${this.CRYPTO_PREFIX}_${cryptoToken}`,
      );

      if (!userId) {
        this.logger.warn('Invalid or expired crypto token');
        throw new ValidationException('Invalid or expired crypto token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(
          `Password reset failed, user not found (ID: ${userId})`,
        );
        throw new NotFoundAppException('User not found');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      this.logger.log(`Password updated for userId: ${user.id}`);

      // delete crypto
      await this.redis.del(`${this.CRYPTO_PREFIX}_${cryptoToken}`);
      this.logger.log('Crypto token deleted after password reset');

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

      this.logger.error(
        'Change password failed',
        error.stack,
      );

      throw new HttpException(
        'Failed to change password',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
