import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SupplierImportsService {
  constructor(private prisma: PrismaService) {}

  async getActivity(): Promise<ReturnType<typeof cResponseData>> {
    try {
      const [totalUser, totalImapConnection, failedImapImports] =
        await Promise.all([
          this.prisma.user.count({ where: { role: 'USER', isDeleted: false } }),
          this.prisma.imapConfiguration.count({
            where: {
              connect: true,
              connectionStatus: 'CONNECTED',
            },
          }),
          this.prisma.invoice.count({
            where: {
              invoiceSource: 'EMAIL',
              haveAttachment: false,
            },
          }),
        ]);

      return cResponseData({
        data: {
          totalUser: totalUser || 0,
          totalImapConnection: totalImapConnection || 0,
          failedImapImports: failedImapImports || 0,
        },
        message: 'Supplier import activity data fetched successfully',
      });
    } catch (error) {
      console.error('Get supplier import activity error:', error);
      throw new HttpException(
        'Failed to fetch supplier import activity data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRecentUsers(): Promise<ReturnType<typeof cResponseData>> {
    try {
      const recentUsers = await this.prisma.user.findMany({
        where: { role: 'USER', isDeleted: false },
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
          role: true,
          email: true,
          created_at: true,
        },
        take: 5,
        orderBy: { created_at: 'desc' },
      });

      const data = recentUsers.map((recentUser) => ({
        id: recentUser.id,
        name: `${recentUser.profile?.firstName || ''} ${recentUser.profile?.lastName || ''}`,
        role: recentUser.role,
        email: recentUser.email,
        createdAt: recentUser.created_at,
      }));

      return cResponseData({
        data: data,
        message: 'Recent users fetched successfully',
      });
    } catch (error) {
      console.error('Get recent users error:', error);
      throw new HttpException(
        'Failed to fetch recent users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSystemLogs(limit = 5): Promise<ReturnType<typeof cResponseData>> {
    try {
      const logs = await this.prisma.activityLog.findMany({
        where: {
          category: 'SYSTEM',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const formattedLogs = logs.map((log) => ({
        time: new Date(log.createdAt as Date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        message: log.title,
        level: log.level.toLowerCase(),
        details: log.description,
      }));

      return cResponseData({
        success: true,
        message: 'System logs fetched successfully',
        data: formattedLogs,
      });
    } catch (error) {
      console.error('Get system logs error:', error);
      throw new HttpException(
        'Failed to fetch system logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
