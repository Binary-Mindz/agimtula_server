import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    return await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });
  }

  async updatePreferences(user:jwtPayload, dto: UpdateNotificationSettingsDto) {
    return this.prisma.notificationSetting.upsert({
      where: { userId: user.sub },
      update: dto,
      create: {
        userId: user.sub,
        notificationEmail: dto.notificationEmail ?? user.email,
        ...dto,
      },
    });
  }
}
