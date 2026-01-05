/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
   try {
     const notification = await this.prisma.notificationSetting.findUnique({
       where: { userId },
     });

     return cResponseData({
       data: notification,
     });
   } catch (error) {
    return cResponseData({
      message: 'Failed to get notification settings',
      error: 'Failed to get notification settings',
    });
   }
  }

  async updatePreferences(
    user: jwtPayload,
    dto: UpdateNotificationSettingsDto,
  ) {
    try {
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
    } catch (error) {
      return cResponseData({
        message: 'Failed to update notification settings',
        error: 'Failed to update notification settings',
      });
    }
  }
}
