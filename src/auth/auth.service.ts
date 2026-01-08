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
import { CreateAuthDto } from './dto/create-auth.dto';
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
import { logpriority, LogType } from 'prisma/generated/prisma/enums';

interface Login2FAPayload {
  userId: string;
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
  ) {}

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

  async create(createAuthDto: CreateAuthDto) {
    try {
      const isUser = await this.prisma.user.findFirst({
        where: {
          email: {
            email: createAuthDto.email,
          },
        },
      });

      if (isUser) {
        throw new ConflictException('User already exists');
      }

      const hashedPass = await bcrypt.hash(createAuthDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          profile: {
            create: {
              firstName: createAuthDto.firstName,
              lastName: createAuthDto.lastName,
            },
          },
          email: {
            create: {
              email: createAuthDto.email,
            },
          },
          password: hashedPass,
        },
        include: {
          profile: true,
          email: true,
        },
      });

      return cResponseData({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          firstName: user.profile?.firstName,
          lastName: user.profile?.lastName,
          email: user.email?.email,
        },
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('Create user error:', error);
      throw new BadRequestException('Failed to create user');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: { email: loginDto.email } },
        include: { email: true, profile: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new ForbiddenException('Invalid credentials');
      }

      if (!user.email) {
        throw new UnauthorizedException('User not valid');
      }

      // 2FA LOGIN FLOW
      if (user.twoFactorEnabled) {
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
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Login failed');
    }
  }
  async verifyLogin2FA(dto: VerifyTwoFADto) {
    try {
      const { email, code } = dto;

      const redisKey = `2fa:login:${email}`;
      const payload = await this.getRedisValue<Login2FAPayload>(redisKey);

      if (!payload) {
        throw new ForbiddenException('OTP expired or invalid');
      }

      if (payload.attempts >= 5) {
        await this.redis.del(redisKey);
        throw new ForbiddenException('Maximum attempts exceeded');
      }

      if (payload.code !== code) {
        payload.attempts += 1;
        await this.setRedisValue(redisKey, payload, 300);
        throw new ForbiddenException('Invalid OTP');
      }

      await this.redis.del(redisKey);

      const user = await this.prisma.user.findFirst({
        where: { id: payload.userId },
        include: { email: true, profile: true },
      });

      if (!user || !user.email) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = await this.generateAccessToken({
        sub: user.id,
        email: user.email.email,
        role: user.role,
      });

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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        throw new ForbiddenException('Invalid password');
      }

      const hashedPass = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPass,
        },
      });

      return cResponseData({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
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
      await this.prisma.email.delete({
        where: { userId },
      });

      return cResponseData({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      throw new BadRequestException('Failed to delete account');
    }
  }

  async updateProfilepic(userId: string, profilePic: string) {
    try {
      const userProfile = await this.prisma.user.findFirst({
        where: { id: userId },
        select: { profile: true },
      });
      if (!userProfile) {
        throw new NotFoundException('User not found');
      }

      console.log(profilePic);
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
        throw new BadRequestException('User Updation Failed');
      }

      return cResponseData({
        success: true,
        message: 'Profile picture updated successfully',
        data: user,
      });
    } catch (error) {
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

      return cResponseData({
        success: true,
        message: 'Profile picture removed successfully',
      });
    } catch (error) {
      throw new BadRequestException('Failed to remove profile picture');
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    try {
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
        throw new BadRequestException('User Updation Failed');
      }

      return cResponseData({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update profile');
    }
  }

  async getProfile(userId: string) {
    try {
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
        throw new NotFoundException('User not found');
      }

      return cResponseData({
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get profile');
    }
  }

  findAll() {
    return 'This section returns all auth related data';
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
