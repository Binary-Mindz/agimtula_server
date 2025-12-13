import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
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
// import { UpdateAuthDto } from './dto/update-auth.dto';

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
