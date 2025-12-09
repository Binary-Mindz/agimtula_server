import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { PrismaService } from 'src/config/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { User } from 'prisma/generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import {
  ForgetPassDto,
  ResetPass,
  ValidateForgetPass,
} from './dto/forget-pass-dto';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { jwtPayload } from './types/jwt-payload';
// import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mail: SmtpMailService,
  ) {}

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
        email: createAuthDto.email,
      },
    });

    if (isUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPass = await bcrypt.hash(createAuthDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: createAuthDto.firstName,
        lastName: createAuthDto.lastName,
        email: createAuthDto.email,
        password: hashedPass,
      },
    });

    await this.prisma.email.create({
      data: {
        userId: user.id,
        email: createAuthDto.email,
      },
    });

    return {
      message: 'User created successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
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

    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      accessToken,
    };
  }

  async sendForgetPassCode(dto: ForgetPassDto) {
    const { email } = dto;

    const user = await this.prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const existing = await this.prisma.forgetPass.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    let finalCode: number;

    if (existing) {
      const now = new Date();
      const createdAt = new Date(existing.createdAt);

      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffMinutes < 15) {
        finalCode = existing.code;
      } else {
        await this.prisma.forgetPass.deleteMany({
          where: { email },
        });

        finalCode = Math.floor(100000 + Math.random() * 900000);

        await this.prisma.forgetPass.create({
          data: {
            email,
            code: finalCode,
          },
        });
      }
    } else {
      finalCode = Math.floor(100000 + Math.random() * 900000);

      await this.prisma.forgetPass.create({
        data: {
          email,
          code: finalCode,
        },
      });
    }

    await this.mail.sendMail(
      dto.email,
      'Forget Password Code',
      `
        <h3>AuthSystem</h3>
        <p>Your email verification code:</p>
        <h2>${finalCode}</h2>
        <p>This code is valid for 15 minutes.</p>
      `,
    );

    return {
      message: 'Forget password code sent successfully',
    };
  }

  async verifyForgetPassCode(data: ValidateForgetPass) {
    try {
      const code = Number(data.verificationCode);
      const isValid = await this.prisma.forgetPass.findFirst({
        where: {
          email: data.email,
          code,
        },
      });
      if (!isValid) {
        throw new ForbiddenException(
          'Not allowed to forget your password or no account with this mail',
        );
      }

      const now = new Date().getTime();

      const createdAt = new Date(isValid.createdAt).getTime();

      const ExpirationLimit = 15 * 60 * 1000;

      if (now - createdAt > ExpirationLimit) {
        throw new ForbiddenException(
          'Your request to reset code is not valid yet',
        );
      }

      await this.prisma.forgetPass.update({
        where: {
          id: isValid.id,
        },
        data: {
          isVerified: true,
        },
      });

      return {
        message: 'Code is verified, now you can change your password',
      };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(data: ResetPass) {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: data.email,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isValid = await this.prisma.forgetPass.findFirst({
        where: {
          email: data.email,
          isVerified: true,
        },
      });

      if (!isValid) {
        throw new ForbiddenException('Not allowed to change your password');
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

      await this.prisma.forgetPass.deleteMany({
        where: {
          email: data.email,
        },
      });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  // update(id: number, updateAuthDto: UpdateAuthDto) {
  //   return `This action updates a #${id} auth`;
  // }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  generateToken(payload: User) {}
}
