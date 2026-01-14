import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { cResponseData } from 'src/common/cResponse';
import { PrismaService } from 'src/config/database/prisma.service';
import { NotFoundAppException } from 'src/common/app-exceptions';

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
    try {
      if (!transactions || transactions.length === 0) {
        throw new HttpException('No transactions provided', HttpStatus.BAD_REQUEST);
      }

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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Store transactions error:', error);
      throw new HttpException(
        'Failed to store transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllTransactions() {
    try {
      return await this.prisma.transaction.findMany({
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      console.error('Get all transactions error:', error);
      throw new HttpException(
        'Failed to retrieve transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getAllUserTransactions(userId: string) {
    try {
      const userExit = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
      });
      if (!userExit) {
        throw new NotFoundAppException('User not found');
      }
      const data = await this.prisma.transaction.findMany({
        where: { userId: userId },
        orderBy: { date: 'desc' },
      });
      return cResponseData({
        data,
        message: `Transactions for user ${userId} retrieved successfully`,
      });
    } catch (error) {
      if (error instanceof NotFoundAppException) {
        throw error;
      }
      console.error(error);
      throw new HttpException(
        'Failed to retrieve transactions for user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionsBySource(source: string) {
    try {
      if (!source) {
        throw new HttpException('Source is required', HttpStatus.BAD_REQUEST);
      }

      return await this.prisma.transaction.findMany({
        where: { source },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get transactions by source error:', error);
      throw new HttpException(
        'Failed to retrieve transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async matchTransactions(): Promise<number> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { status: 'UNMATCHED' },
        orderBy: { date: 'desc' },
      });

      let matchedCount = 0;

      for (let i = 0; i < transactions.length; i++) {
        for (let j = i + 1; j < transactions.length; j++) {
          const trx1 = transactions[i];
          const trx2 = transactions[j];

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
    } catch (error) {
      console.error('Match transactions error:', error);
      throw new HttpException(
        'Failed to match transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
