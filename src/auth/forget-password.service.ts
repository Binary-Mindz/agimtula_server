import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
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

@Injectable()
export class ForgetPasswordService {
  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
    private redis: RedisServiceService,
  ) {}

  private readonly FORG_PREFIX = 'forPas';
  private readonly CRYPTO_PREFIX = 'cryp';
  private readonly EXPIRATION_TIME = 3000;

  private storeRedis = async (
    key: string,
    value: string,
    type: 'CODE' | 'CRYPTO',
  ) => {
    if (type === 'CODE') {
      await this.redis.set(
        `${this.FORG_PREFIX}_${key}`,
        value,
        'EX',
        this.EXPIRATION_TIME,
      );
    } else {
      await this.redis.set(
        `${this.CRYPTO_PREFIX}_${key}`,
        value,
        'EX',
        this.EXPIRATION_TIME,
      );
    }
  };

  private generateCrypto(): string {
    return crypto.randomUUID();
  }

  private generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  async sendForgetPassCode(dto: ForgetPassDto) {
    const { email } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          email: email,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const existing = await this.redis.get(`${this.FORG_PREFIX}_${email}`);

    let finalCode: number;

    if (existing) {
      finalCode = Number(existing);

      await this.storeRedis(email, finalCode.toString(), 'CODE');
    } else {
      finalCode = this.generateRandomCode();
      await this.storeRedis(email, finalCode.toString(), 'CODE');
    }

    await this.mail.sendMail(
      dto.email,
      'Forget Password Code',
      `
        <h3>AuthSystem</h3>
        <p>Your email verification code:</p>
        <h2>${finalCode}</h2>
        <p>This code is valid for 5 minutes.</p>
      `,
    );

    return cResponseData({
      message: 'Forget password code sent successfully',
    });
  }

  async verifyForgetPassCode(data: ValidateForgetPass) {
    try {
      const val = await this.redis.get(`${this.FORG_PREFIX}_${data.email}`);

      const user = await this.prisma.user.findFirst({
        where: {
          email: {
            email: data.email,
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!val || val !== data.verificationCode.toString()) {
        throw new ForbiddenException('Code invalid or expired');
      }

      await this.redis.del(`${this.FORG_PREFIX}_${data.email}`);

      const newCrypto = this.generateCrypto();

      await this.storeRedis(newCrypto, user.id, 'CRYPTO');

      return cResponseData({
        message: 'Code is verified, now you can change your password',
        data: {
          crypto: newCrypto,
        },
      });
    } catch (error) {
      console.error('Error in verifyForgetPassCode:', error);
      throw error;
    }
  }

  async changePassword(data: ResetPass, cryptoVal: string) {
    const crypto = cryptoVal;

    const userId = await this.redis.get(`${this.CRYPTO_PREFIX}_${crypto}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired crypto');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPass = await bcrypt.hash(data.password, 10);

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPass,
      },
    });

    await this.redis.del(`${this.CRYPTO_PREFIX}_${crypto}`);

    return cResponseData({
      message: 'Password changed successfully',
    });
  }
}
