import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SupplierImportsService {
  constructor(private prisma: PrismaService) {}

  async getActivity() {
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

  async getRecentUsers() {
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
}
