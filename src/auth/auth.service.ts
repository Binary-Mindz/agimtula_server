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
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
import { deleteFromCloudinary } from 'src/config/cloudinary/deleteImage';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyTwoFADto } from './dto/two-fa.dto';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: SmtpMailService,
  ) { }

  private readonly logger = new Logger(AuthService.name);

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
      message: 'User created successfully',
      data: {
        id: user.id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email?.email,
      },
    });
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          email: loginDto.email,
        },
      },
      include: {
        email: true,
        profile: true,
      },
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

    const is2FAEnabled = user.twoFactorEnabled;

    if (is2FAEnabled) {
      const existing = await this.prisma.twoFA.findFirst({
        where: { email: user.email.email },
      });

      let code: number | string;
      if (existing) {
        const diffMinutes =
          (Date.now() - new Date(existing.createdAt).getTime()) / 60000;

        if (diffMinutes < 5) {
          code = existing.code;
        } else {
          await this.prisma.twoFA.delete({ where: { id: existing.id } });
          code = Math.floor(100000 + Math.random() * 900000);
          await this.prisma.twoFA.create({
            data: { email: user.email.email, code, purpose: 'LOGIN' },
          });
        }
      } else {
        code = Math.floor(100000 + Math.random() * 900000);
        await this.prisma.twoFA.create({
          data: { email: user.email.email, code, purpose: 'LOGIN' },
        });
      }

      await this.mail.sendMail(
        user.email.email,
        'Your 2FA Verification Code',
        `
        <h3>Enable Two-Factor Authentication</h3>
        <p>Your 6-digit verification code:</p>
        <h2 style="letter-spacing: 4px;">${code}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      );

      return cResponseData({
        message: 'Verify your 2FA code to complete login',
        data: {
          twoFactorEnabled: true,
          userId: user.id,
        },
      });
    }

    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email.email,
      role: user.role,
    });

    return cResponseData({
      message: 'Login successful',
      data: {
        id: user.id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email.email,
        accessToken,
      },
    });
  }

  async verifyLogin2FA(dto: VerifyTwoFADto) {
    const { email, code } = dto;

    const record = await this.prisma.twoFA.findFirst({
      where: { email, purpose: 'LOGIN' },
    });

    if (!record || record.code !== code) {
      throw new ForbiddenException('Invalid or expired OTP');
    }

    const isExpired = Date.now() - record.createdAt.getTime() > 5 * 60 * 1000;
    if (isExpired) {
      await this.prisma.twoFA.delete({ where: { id: record.id } });
      throw new ForbiddenException('OTP has expired');
    }

    await this.prisma.twoFA.delete({ where: { id: record.id } });

    const user = await this.prisma.user.findFirst({
      where: { email: { email } },
      include: { email: true, profile: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.email) {
      throw new UnauthorizedException('User email not found');
    }
    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email.email,
      role: user.role,
    });

    return cResponseData({
      message: 'Login successful',
      data: {
        id: user.id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email.email,
        accessToken,
      },
    });
  }

  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
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

    return cResponseData({ message: 'Password updated successfully' });
  }

  async deleteAccount(userId: string) {
    await this.prisma.email.delete({
      where: { userId },
    });

    return cResponseData({
      message: 'Account deleted successfully',
    });
  }

  async updateProfilepic(file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new NotFoundException('File not found');
    }

    const userProfile = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { profile: true },
    });

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    if (userProfile.profile?.profilePictureKey) {
      await deleteFromCloudinary(userProfile.profile?.profilePictureKey);
    }

    const uploadResult = await uploadToCloudinary(file);
    const profilePicture = uploadResult.secure_url;
    const profilePictureKey = uploadResult.public_id;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            profilePicture,
            profilePictureKey,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User Updation Failed');
    }

    return cResponseData({
      message: 'Profile picture updated successfully',
      data: { profilePicture },
    });
  }

  async removeProfilePic(userId: string) {
    const userProfile = await this.prisma.user.findFirst({
      where: { id: userId },
      select: { profile: true },
    });

    if (userProfile?.profile?.profilePictureKey) {
      await deleteFromCloudinary(userProfile.profile?.profilePictureKey);
    }
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
      message: 'Profile picture removed successfully',
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
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
      message: 'Profile updated successfully',
    });
  }

  async getProfile(userId: string) {
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
      data: user,
    });
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
