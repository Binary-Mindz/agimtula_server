import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
        success: true,
        message: 'Notification settings retrieved successfully',
        data: notification,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get notification preferences error:', error);
      throw new HttpException(
        'Failed to get notification settings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePreferences(
    user: jwtPayload,
    dto: UpdateNotificationSettingsDto,
  ) {
    try {
      const notifications = await this.prisma.notificationSetting.upsert({
        where: { userId: user.sub },
        update: {
          ...dto,
          notificationEmail: dto.notificationEmail ?? user.email,
        },
        create: {
          userId: user.sub,
          notificationEmail: dto.notificationEmail ?? user.email,
          ...dto,
        },
      });

      return cResponseData({
        success: true,
        message: 'Notification settings updated successfully',
        data: notifications,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Update notification preferences error:', error);
      throw new HttpException(
        'Failed to update notification settings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
