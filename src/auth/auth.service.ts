/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { jwtPayload } from './types/jwt-payload';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyTwoFADto } from './dto/two-fa.dto';
import { cResponseData } from 'src/common/cResponse';
import { RedisServiceService } from 'src/config/redis-service/redis-service.service';
import { SendRegistrationOtpDto } from './dto/send-registration-otp.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import * as crypto from 'crypto';
import { profile } from 'console';

interface Login2FAPayload {
  userId: string;
  code: number;
  attempts: number;
  createdAt: number;
}

interface RegistrationOtpPayload {
  email: string;
  code: number;
  attempts: number;
  createdAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: SmtpMailService,
    private redis: RedisServiceService,
  ) { }

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

  async generateAccessToken(jwtPayload: jwtPayload) {
    return this.jwt.signAsync(
      { sub: jwtPayload.sub, email: jwtPayload.email, role: jwtPayload.role },
      {
        secret: process.env.JWT_SECRET as string,
        expiresIn: '1d',
      },
    );
  }

  async sendRegistrationOtp(dto: SendRegistrationOtpDto) {
    try {
      this.logger.log(`Attempting to send registration OTP to: ${dto.email}`);

      const isUser = await this.prisma.user.findFirst({
        where: {
          email: {
            email: dto.email,
          },
        },
      });

      if (isUser) {
        this.logger.warn(`Registration attempt with existing email: ${dto.email}`);
        throw new ConflictException('User already exists with this email');
      }

      const redisKey = `otp:registration:${dto.email}`;
      const code = this.generateCode();

      const payload: RegistrationOtpPayload = {
        email: dto.email,
        code,
        attempts: 0,
        createdAt: Date.now(),
      };

      await this.setRedisValue(redisKey, payload, 300);
      this.logger.debug(`OTP stored in Redis for email: ${dto.email}`);

      await this.mail.sendMail(
        dto.email,
        'Your Registration OTP Code',
        `
        <h3>Registration Verification</h3>
        <p>Your 6-digit verification code:</p>
        <h2>${code}</h2>
        <p>This code expires in 5 minutes.</p>
      `,
      );

      this.logger.log(`Registration OTP sent successfully to: ${dto.email}`);
      return cResponseData({
        message: 'OTP sent successfully to your email',
        data: { email: dto.email },
      });
    } catch (error) {
      this.logger.error(`Failed to send registration OTP to ${dto.email}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Failed to send OTP');
    }
  }

  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto) {
    try {
      this.logger.log(`Verifying registration OTP for email: ${dto.email}`);

      const redisKey = `otp:registration:${dto.email}`;
      const payload =
        await this.getRedisValue<RegistrationOtpPayload>(redisKey);

      if (!payload) {
        this.logger.warn(`OTP not found or expired for email: ${dto.email}`);
        throw new BadRequestException(
          'OTP expired or not found. Please request a new one.',
        );
      }

      if (payload.attempts >= 3) {
        await this.redis.del(redisKey);
        this.logger.warn(`Max OTP attempts exceeded for email: ${dto.email}`);
        throw new BadRequestException(
          'Too many failed attempts. Please request a new OTP.',
        );
      }

      if (payload.code !== dto.code) {
        payload.attempts += 1;
        await this.setRedisValue(redisKey, payload, 300);
        this.logger.warn(`Invalid OTP attempt for email: ${dto.email}. Attempts: ${payload.attempts}/3`);
        throw new BadRequestException(
          `Invalid OTP code. ${3 - payload.attempts} attempts remaining.`,
        );
      }

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const tokenKey = `otp:verified:${verificationToken}`;

      await this.setRedisValue(tokenKey, { email: dto.email }, 600);
      await this.redis.del(redisKey);

      this.logger.log(`OTP verified successfully for email: ${dto.email}`);
      return cResponseData({
        message: 'OTP verified successfully',
        data: {
          verificationToken,
          email: dto.email,
        },
      });
    } catch (error) {
      this.logger.error(`OTP verification failed for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message || 'OTP verification failed');
    }
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    try {
      this.logger.log(`Completing registration for email: ${dto.email}`);

      const tokenKey = `otp:verified:${dto.verificationToken}`;
      const verified = await this.getRedisValue<{ email: string }>(tokenKey);

      if (!verified || verified.email !== dto.email) {
        this.logger.warn(`Invalid verification token for email: ${dto.email}`);
        throw new BadRequestException('Invalid or expired verification token');
      }

      const isUser = await this.prisma.user.findFirst({
        where: {
          email: {
            email: dto.email,
          },
        },
      });

      if (isUser) {
        this.logger.warn(`User already exists for email: ${dto.email}`);
        throw new ConflictException('User already exists');
      }

      const hashedPass = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          profile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
            },
          },
          email: {
            create: {
              email: dto.email,
            },
          },
          password: hashedPass,
        },
        include: {
          profile: true,
          email: true,
        },
      });

      await this.redis.del(tokenKey);

      this.logger.log(`User registered successfully: ${user.id} - ${dto.email}`);
      return cResponseData({
        message: 'User registered successfully',
        data: {
          id: user.id,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email?.email,
        },
      });
    } catch (error) {
      this.logger.error(`Registration completion failed for ${dto.email}: ${error.message}`, error.stack);
      throw new BadRequestException(
        error.message || 'Failed to complete registration',
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt for email: ${loginDto.email}`);

      const user = await this.prisma.user.findFirst({
        where: { email: { email: loginDto.email } },
        select: {
          id: true,
          role: true,
          email: true,
          profile: true,
          isDeleted: true,
          password: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        this.logger.warn(`Login failed - User not found: ${loginDto.email}`);
        throw new UnauthorizedException('User not found');
      }

      if (user.isDeleted) {
        this.logger.warn(`Login attempt on deleted account: ${loginDto.email}`);
        throw new NotFoundException('User account is deleted');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for: ${loginDto.email}`);
        throw new ForbiddenException('Invalid credentials');
      }

      if (!user.email) {
        this.logger.error(`User email missing for ID: ${user.id}`);
        throw new UnauthorizedException('User not valid');
      }

      // 2FA LOGIN FLOW
      if (user.twoFactorEnabled) {
        this.logger.log(`2FA enabled for user: ${user.email.email}`);
        const redisKey = `2fa:login:${user.email.email}`;

        let payload = await this.getRedisValue<Login2FAPayload>(redisKey);

        if (!payload) {
          payload = {
            userId: user.id,
            code: this.generateCode(),
            attempts: 0,
            createdAt: Date.now(),
          };

          await this.setRedisValue(redisKey, payload, 300);
          this.logger.debug(`2FA code generated and stored for: ${user.email.email}`);
        }

        await this.mail.sendMail(
          user.email.email,
          'Your 2FA Verification Code',
          `
        <h3>Login Verification</h3>
        <p>Your 6-digit verification code:</p>
        <h2>${payload.code}</h2>
        <p>This code expires in 5 minutes.</p>
      `,
        );

        this.logger.log(`2FA code sent to: ${user.email.email}`);
        return cResponseData({
          success: true,
          message: 'Verify your 2FA code to complete login',
          data: {
            twoFactorEnabled: true,
            email: user.email.email,
          },
        });
      }

      // NORMAL LOGIN
      const accessToken = await this.generateAccessToken({
        sub: user.id,
        email: user.email.email,
        role: user.role,
      });

      this.logger.log(`User logged in successfully: ${user.id} - ${user.email.email}`);
      return cResponseData({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email.email,
          role: user.role,
          profilePicture: user.profile?.profilePicture,
          accessToken,
        },
      });
    } catch (error) {
      this.logger.error(`Login failed for ${loginDto.email}: ${error.message}`, error.stack);
      throw new BadRequestException(error.message || 'Login failed');
    }
  }

  async verifyLogin2FA(dto: VerifyTwoFADto) {
    try {
      this.logger.log(`Verifying 2FA login for email: ${dto.email}`);

      const { email, code } = dto;

      const redisKey = `2fa:login:${email}`;
      const payload = await this.getRedisValue<Login2FAPayload>(redisKey);

      if (!payload) {
        this.logger.warn(`2FA OTP expired or not found for: ${email}`);
        throw new ForbiddenException('OTP expired or invalid');
      }

      if (payload.attempts >= 5) {
        await this.redis.del(redisKey);
        this.logger.warn(`Maximum 2FA attempts exceeded for: ${email}`);
        throw new ForbiddenException('Maximum attempts exceeded');
      }

      if (payload.code !== code) {
        payload.attempts += 1;
        await this.setRedisValue(redisKey, payload, 300);
        this.logger.warn(`Invalid 2FA code for: ${email}. Attempts: ${payload.attempts}/5`);
        throw new ForbiddenException('Invalid OTP');
      }

      await this.redis.del(redisKey);

      const user = await this.prisma.user.findFirst({
        where: { id: payload.userId },
        include: { email: true, profile: true },
      });

      if (!user || !user.email) {
        this.logger.error(`User not found after 2FA verification: ${payload.userId}`);
        throw new UnauthorizedException('User not found');
      }

      const accessToken = await this.generateAccessToken({
        sub: user.id,
        email: user.email.email,
        role: user.role,
      });

      this.logger.log(`2FA login successful for: ${user.email.email}`);
      return cResponseData({
        success: true,
        message: 'Login successful',
        data: {
          id: user.id,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email.email,
          accessToken,
        },
      });
    } catch (error) {
      this.logger.error(`2FA verification failed for ${dto.email}: ${error.message}`);
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new BadRequestException('2FA verification failed');
    }
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      this.logger.log(`Password update attempt for user: ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not found for password update: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid old password for user: ${userId}`);
        throw new ForbiddenException('Invalid password');
      }

      const hashedPass = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPass,
        },
      });

      this.logger.log(`Password updated successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      this.logger.error(`Password update failed for user ${userId}: ${error.message}`);
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update password');
    }
  }

  async deleteAccount(userId: string) {
    try {
      this.logger.log(`Account deletion request for user: ${userId}`);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
        },
      });

      this.logger.log(`Account deleted successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      this.logger.error(`Account deletion failed for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete account');
    }
  }

  async updateProfilepic(userId: string, profilePic: string) {
    try {
      this.logger.log(`Profile picture update for user: ${userId}`);

      const userProfile = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { profile: true },
      });

      if (!userProfile) {
        this.logger.warn(`User not found for profile pic update: ${userId}`);
        throw new NotFoundException('User not found');
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              profilePicture: profilePic,
            },
          },
        },
      });

      if (!user) {
        this.logger.error(`Profile picture update failed for user: ${userId}`);
        throw new BadRequestException('User Updation Failed');
      }

      this.logger.log(`Profile picture updated successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Profile picture updated successfully',
        data: user,
      });
    } catch (error) {
      this.logger.error(`Profile picture update failed for user ${userId}: ${error.message}`, error.stack);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update profile picture');
    }
  }

  async removeProfilePic(userId: string) {
    try {
      this.logger.log(`Removing profile picture for user: ${userId}`);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              profilePicture: null,
              profilePictureKey: null,
            },
          },
        },
      });

      this.logger.log(`Profile picture removed successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Profile picture removed successfully',
      });
    } catch (error) {
      this.logger.error(`Profile picture removal failed for user ${userId}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to remove profile picture');
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    try {
      this.logger.log(`Profile update for user: ${userId}`);

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            update: {
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
            },
          },
        },
      });

      if (!user) {
        this.logger.error(`Profile update failed for user: ${userId}`);
        throw new BadRequestException('User Updation Failed');
      }

      this.logger.log(`Profile updated successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      this.logger.error(`Profile update failed for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update profile');
    }
  }

  async getProfile(userId: string) {
    try {
      this.logger.log(`Fetching profile for user: ${userId}`);

      const user = await this.prisma.user.findFirst({
        where: { id: userId },
        select: {
          password: false,
          email: {
            select: {
              email: true,
            },
          },
          profile: true,
          businessInfo: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Profile retrieved successfully for user: ${userId}`);
      return cResponseData({
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      this.logger.error(`Failed to get profile for user ${userId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get profile');
    }
  }






}
