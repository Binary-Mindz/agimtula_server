import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  // Single method to log anything
  async log(data: {
    userId?: string;
    userName?: string;
    userEmail?: string;
    type: string;
    title: string;
    description?: string;
    amount?: number;
    currency?: string;
    category: 'USER' | 'ADMIN' | 'SYSTEM';
    level?: 'INFO' | 'WARNING' | 'ERROR';
    metadata?: any;
  }) {
    try {
      await this.prisma.activityLog.create({
        data: {
          ...data,
          level: data.level || 'INFO',
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Get activities by category
   async getActivities(category: string, limit = 50) {
    return await this.prisma.activityLog.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Get user's activities
   async getUserActivities(userId: string, limit = 20) {
    return await this.prisma.activityLog.findMany({
      where: { userId, category: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
