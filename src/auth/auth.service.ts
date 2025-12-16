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
import { Cron, CronExpression } from '@nestjs/schedule';
import uploadToCloudinary from 'src/config/cloudinary/cloudinary';
import { deleteFromCloudinary } from 'src/config/cloudinary/deleteImage';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: SmtpMailService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

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

    return {
      message: 'User created successfully',
      user: {
        id: user.id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email?.email,
      },
    };
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

    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email.email,
      },
      accessToken,
    };
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

    return {
      message: 'Password updated successfully',
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.email.delete({
      where: { userId },
    });

    return {
      message: 'Account deleted successfully',
    };
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

    return {
      message: 'Profile picture updated successfully',
      profilePicture,
    };
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

    return {
      message: 'Profile picture removed successfully',
    };
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
            jobTitle: data.jobTitle,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User Updation Failed');
    }

    return {
      message: 'Profile updated successfully',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            jobTitle: true,
            profilePicture: true,
          },
        },
        password: false,
        email: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email?.email,
        phone: user.profile?.phone,
        jobTitle: user.profile?.jobTitle,
        profilePicture: user.profile?.profilePicture,
      },
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
