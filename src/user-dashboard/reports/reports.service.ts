import { Injectable } from '@nestjs/common';
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
        where: { userId, createdAt: { gte: sixMonthsAgo } },
        _sum: { amount: true },
      }),
      this.prisma.mileage.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),

      this.prisma.receipt.findMany({
        where: { userId, createdAt: { gte: sixMonthsAgo } },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.mileage.findMany({
        where: {
          userId,
        },
        select: { amount: true },
      }),
    ]);

    const all = [...receipt, mileage];

      const monthlySummary: { year: number; month: number; total: number }[] = [];
      
    //   for (const item of all) {
    //     const year = item.createdAt.getFullYear();
    //     const month = item.createdAt.getMonth() + 1;

    //     const existingEntry = monthlySummary.find(
    //       (entry) => entry.year === year && entry.month === month,
    //     );

    //     if (existingEntry) {
    //       existingEntry.total += item.amount;
    //     } else {
    //       monthlySummary.push({
    //         year,
    //         month,
    //         total: item.amount,
    //       });
    //     }
    //   }
  }
}
