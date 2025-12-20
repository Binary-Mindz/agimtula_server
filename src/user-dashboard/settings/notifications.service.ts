import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    const notification = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    return cResponseData({
      data: notification,
    });
  }

  async updatePreferences(
    user: jwtPayload,
    dto: UpdateNotificationSettingsDto,
  ) {
    const notifications = await this.prisma.notificationSetting.upsert({
      where: { userId: user.sub },
      update: dto,
      create: {
        userId: user.sub,
        notificationEmail: dto.notificationEmail ?? user.email,
        ...dto,
      },
    });
    return cResponseData({ data: notifications });
  }
}
