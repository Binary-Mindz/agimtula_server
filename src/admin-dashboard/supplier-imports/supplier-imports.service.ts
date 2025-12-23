import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class SupplierImportsService {
  constructor(private prisma: PrismaService) {}

  async getActivity() {
    const [totalUser, totalImapConnection] = await Promise.all([
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.imapConfiguration.count(),
    ]);

    return cResponseData({
      data: {
        totalUser: totalUser || 0,
        totalImapConnection: totalImapConnection || 0,
      },
      message: 'Supplier import activity data fetched successfully',
    });
  }

  async getRecentUsers() {
    const recentUsers = await this.prisma.user.findMany({
      where: { role: 'USER' },
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

    return cResponseData({
      data: recentUsers,
      message: 'Recent users fetched successfully',
    });
  }
}
