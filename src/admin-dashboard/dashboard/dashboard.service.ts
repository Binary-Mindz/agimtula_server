import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async getData() {
    const userCount = await this.prisma.user.count({
      where: {
        role: 'USER',
        status: true,
      },
    });

    // active subscription total customers sum

    // reveneue  sum

    // pending payment count

    // monthly revenue track
    // user grouth return both . prev and present months

    // recent activity like create acc, payment related message or anything,

    // make a separate activity log file where every update will call an api to update anyghing like user registered or updated any field or

    return cResponseData({
      data: userCount,
    });
  }
}
