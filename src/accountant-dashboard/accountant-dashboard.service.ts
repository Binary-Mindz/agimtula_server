import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';
import { TransactionQueryDto } from './dto/TransactionQueryDto';
import { TransactionStatus } from 'prisma/generated/prisma/enums';

@Injectable()
export class AccountantDashboardService {
  constructor(private readonly prisma: PrismaService) { }

  // ==========================
  // Find All Transactions (Dashboard)
  // ==========================
  async findAll(
    userId: string,
    accountantId: string,
    query: TransactionQueryDto
  ) {
    console.log({ userId });

    try {
      // =========================
      // 1️⃣ Validate accountant
      // =========================
      const userExist = await this.prisma.user.findFirst({
        where: { id: accountantId }
      });

      if (!userExist) {
        throw new NotFoundException('User not found');
      }

      if (accountantId === userExist.accountantId) {
        throw new NotFoundException('Client id mismatch');
      }

      // =========================
      // 2️⃣ Pagination + query defaults
      // =========================
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const skip = (page - 1) * limit;
      const search = query.search;

      // Type-safe status handling
      const statusFilter =
        query.status && Object.values(TransactionStatus).includes(query.status)
          ? query.status
          : undefined;

      // =========================
      // 3️⃣ Fetch transactions with search/status/pagination
      // =========================
      const transaction = await this.prisma.transaction.findMany({
        where: {
          userId,
          ...(statusFilter && { status: statusFilter }),
          ...(search && {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { currency: { contains: search, mode: 'insensitive' } }
            ]
          })
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      });

      // Total count for pagination
      const totalCount = await this.prisma.transaction.count({
        where: {
          userId,
          ...(statusFilter && { status: statusFilter }),
          ...(search && {
            OR: [
              { description: { contains: search, mode: 'insensitive' } },
              { currency: { contains: search, mode: 'insensitive' } }
            ]
          })
        }
      });

      // =========================
      // 4️⃣ This month transactions
      // =========================
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const thisMonthTransactions = transaction.filter(trx => {
        const trxDate = new Date(trx.date);
        return trxDate >= startOfMonth && trxDate <= endOfMonth;
      });

      // =========================
      // 5️⃣ Total by currency
      // =========================
      const totalByCurrency = thisMonthTransactions.reduce((acc, trx) => {
        const amount = Number(trx.amount);
        acc[trx.currency] = (acc[trx.currency] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      // =========================
      // 6️⃣ Summary counts
      // =========================
      const summary = {
        totalTransactions: thisMonthTransactions.length,
        matched: 0,
        unmatched: 0,
        missingReceipt: 0
      };

      for (const trx of thisMonthTransactions) {
        if (trx.status === 'MATCHED') summary.matched++;
        if (trx.status === 'UNMATCHED') summary.unmatched++;
      }

      // =========================
      // 7️⃣ Final response
      // =========================
      return cResponseData({
        message: 'Transactions retrieved successfully',
        data: {
          totalByCurrency,
          summary,
          transactions: thisMonthTransactions,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit)
          }
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
