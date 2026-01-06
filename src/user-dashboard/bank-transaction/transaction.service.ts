import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';

interface TransactionRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'MATCHED' | 'UNMATCHED';
  from?: string;
  attachments?: string[];
  accountId?: string;
}

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) { }

  async storeTransactions(transactions: TransactionRow[]) {

    for (const trx of transactions) {

      const existing = await this.prisma.transaction.findFirst({
        where: {
          date: new Date(trx.date),
          amount: new Decimal(trx.amount),
          description: trx.description,
          source: trx.from || 'Unknown',
        },
      });

      if (!existing) {
        await this.prisma.transaction.create({
          data: {
            date: new Date(trx.date),
            description: trx.description,
            amount: new Decimal(trx.amount),
            currency: trx.currency,
            status: trx.status,
            source: trx.from || 'Unknown',
            attachments: trx.attachments || [],
            accountId: trx.accountId,
          },
        });
      }
    }
    return cResponseData({ message: 'Transactions stored successfully' });
  }

  async getAllTransactions() {
    return await this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
  }
  async getAllUserTransactions(userId: string) {

    try {
      const userExit = await this.prisma.user.findFirst({
        where: {
          id: userId
        }
      })
      if (!userExit) {
        throw new NotFoundException('User not found');
      }
      const data = await this.prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
      });
      return cResponseData({ data, message: `Transactions for user ${userId} retrieved successfully` });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to retrieve transactions for user');
    }
  }

  async getTransactionsBySource(source: string) {
    return await this.prisma.transaction.findMany({
      where: { source },
      orderBy: { date: 'desc' },
    });
  }

  async matchTransactions(): Promise<number> {
    const transactions = await this.prisma.transaction.findMany({
      where: { status: 'UNMATCHED' },
      orderBy: { date: 'desc' },
    });

    let matchedCount = 0;
    // amazonq-ignore-next-line

    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const trx1 = transactions[i];
        const trx2 = transactions[j];

        // Match if same amount, currency, and within 1 Hours
        if (
          trx1.currency === trx2.currency &&
          trx1.amount.equals(trx2.amount) &&
          Math.abs(
            new Date(trx1.date).getTime() - new Date(trx2.date).getTime(),
          ) <=
          60 * 60 * 1000
        ) {
          await this.prisma.transaction.updateMany({
            where: { id: { in: [trx1.id, trx2.id] } },
            data: { status: 'MATCHED' },
          });
          matchedCount += 2;
        }
      }
    }

    return matchedCount;
  }
}
