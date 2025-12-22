import { Injectable } from '@nestjs/common';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getReportData(userId: string) {
    const sixMonthsAgo = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 5,
      1,
    );

    const [totalReceipt, totalMileage, receipt, mileage] = await Promise.all([
      this.prisma.receipt.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.mileage.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.receipt.findMany({
        where: { userId, date: { gte: sixMonthsAgo } },
        select: { amount: true, date: true },
      }),
      this.prisma.mileage.findMany({
        where: {
          userId,
          date: { gte: sixMonthsAgo },
        },
        select: { amount: true, date: true },
      }),
    ]);

    console.log(receipt, mileage);

    const all = [...receipt, ...mileage];

    const monthlySummary: { year: number; month: number; total: number }[] = [];

    for (const item of all) {
      const year = item.date.getFullYear();
      const month = item.date.getMonth() + 1;

      const existingEntry = monthlySummary.find(
        (entry) => entry.year === year && entry.month === month,
      );

      if (existingEntry) {
        existingEntry.total += item.amount;
      } else {
        monthlySummary.push({
          year,
          month,
          total: item.amount,
        });
      }
    }

    return cResponseData({
      message: 'Retrived reports data',
      data: {
        totalReceipt: totalReceipt._sum.amount || 0,
        totalMileage: totalMileage._sum.amount || 0,
        monthlySummary,
      },
    });
  }
}
