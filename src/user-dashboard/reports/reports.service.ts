import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReportData(userId: string) {
    const [receipt, mileage] = await Promise.all([
      this.prisma.receipt.aggregate({
        where: {
          userId,
        },
        _sum: { amount: true },
      }),
      this.prisma.mileage.aggregate({
        where: {
          userId,
        },
        _sum: { amount: true },
      }),

    ]);

    const receiptTotal = receipt._sum.amount || 0;
    const mileageTotal = mileage._sum.amount || 0;

    const report = {
      expenseSummury: receiptTotal + mileageTotal,
      receiptTotal,
      mileageTotal,
    };

    // monthly receipt data
  }
}
