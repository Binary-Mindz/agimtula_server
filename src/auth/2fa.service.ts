import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { SmtpMailService } from 'src/config/smtp-mail/smtp-mail.service';
import { EnableTwoFADto, VerifyTwoFADto } from './dto/two-fa.dto';

@Injectable()
export class TwoFAService {
  constructor(
    private prisma: PrismaService,
    private mail: SmtpMailService,
  ) {}

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
    const { email } = dto;

    const user = await this.getUserOrFail(userId, email);

    if (user.twoFactorEnabled) {
      throw new ForbiddenException('2FA is already enabled');
    }

    const existing = await this.prisma.twoFA.findFirst({
      where: { email },
    });

    let code: number;

    if (existing) {
      const diffMinutes =
        (Date.now() - new Date(existing.createdAt).getTime()) / 60000;

      if (diffMinutes < 5) {
        code = existing.code;
      } else {
        await this.prisma.twoFA.delete({ where: { id: existing.id } });
        code = Math.floor(100000 + Math.random() * 900000);
        await this.prisma.twoFA.create({
          data: { email, code, purpose: 'ENABLE_2FA' },
        });
      }
    } else {
      code = Math.floor(100000 + Math.random() * 900000);
      await this.prisma.twoFA.create({
        data: { email, code, purpose: 'ENABLE_2FA' },
      });
    }

    await this.mail.sendMail(
      email,
      'Your 2FA Verification Code',
      `
        <h3>Enable Two-Factor Authentication</h3>
        <p>Your 6-digit verification code:</p>
        <h2 style="letter-spacing: 4px;">${code}</h2>
        <p>This code expires in 5 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    );

    return { message: '2FA code sent successfully to your email' };
  }

  async verifyAndEnableTwoFA(userId: string, dto: VerifyTwoFADto) {
    const { email, code } = dto;

    await this.getUserOrFail(userId, email);

    const record = await this.prisma.twoFA.findFirst({
      where: { email, purpose: 'ENABLE_2FA' },
    });

    if (!record || record.code !== code) {
      if (record) {
        await this.prisma.twoFA.update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        });
      }
      throw new ForbiddenException('Invalid verification code');
    }

    if (record.attempts >= 5) {
      throw new ForbiddenException('Maximum attempts exceeded');
    }

    if (Date.now() - record.createdAt.getTime() > 5 * 60 * 1000) {
      await this.prisma.twoFA.delete({ where: { id: record.id } });
      throw new ForbiddenException('Verification code expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      }),
      this.prisma.twoFA.deleteMany({ where: { email } }),
    ]);

    return { message: '2FA enabled successfully' };
  }

  async sendDisableTwoFACode(userId: string, dto: EnableTwoFADto) {
    const { email } = dto;

    const user = await this.getUserOrFail(userId, email);

    if (!user.twoFactorEnabled) {
      throw new ForbiddenException('2FA is not enabled');
    }

    const existing = await this.prisma.twoFA.findFirst({
      where: { email },
    });

    let code: number;

    if (existing) {
      const diffMinutes =
        (Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60);

      if (diffMinutes < 5) {
        code = existing.code;
      } else {
        await this.prisma.twoFA.delete({ where: { id: existing.id } });
        code = Math.floor(100000 + Math.random() * 900000);
        await this.prisma.twoFA.create({
          data: { email, code, purpose: 'DISABLE_2FA' },
        });
      }
    } else {
      code = Math.floor(100000 + Math.random() * 900000);
      await this.prisma.twoFA.create({
        data: { email, code, purpose: 'DISABLE_2FA' },
      });
    }

    await this.mail.sendMail(
      email,
      'Disable Two-Factor Authentication',
      `
      <h3>Disable Two-Factor Authentication</h3>
      <p>Your verification code:</p>
      <h2 style="letter-spacing: 4px;">${code}</h2>
      <p>This code expires in 5 minutes.</p>
      <p>If you didn’t request this, ignore this email.</p>
    `,
    );

    return { message: 'Disable 2FA code sent to your email' };
  }

  async verifyAndDisableTwoFA(userId: string, dto: VerifyTwoFADto) {
    const { email, code } = dto;

    await this.getUserOrFail(userId, email);

    const record = await this.prisma.twoFA.findFirst({
      where: { email, purpose: 'DISABLE_2FA' },
    });

    if (!record || record.code !== code) {
      throw new ForbiddenException('Invalid verification code');
    }

    if (Date.now() - record.createdAt.getTime() > 5 * 60 * 1000) {
      await this.prisma.twoFA.delete({ where: { id: record.id } });
      throw new ForbiddenException('Verification code expired');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
      }),
      this.prisma.twoFA.deleteMany({ where: { email } }),
    ]);

    return { message: '2FA disabled successfully' };
  }
}
