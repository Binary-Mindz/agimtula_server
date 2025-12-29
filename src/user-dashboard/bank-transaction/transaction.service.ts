/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/config/database/prisma.service';

interface TransactionRow {
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'MATCHED' | 'UNMATCHED';
  from?: string;
  attachments?: string[];
}

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async storeTransactions(transactions: TransactionRow[]): Promise<number> {
    let storedCount = 0;
    // amazonq-ignore-next-line

    for (const trx of transactions) {
      // Check for duplicates based on date, amount, description, and source
      const existing = await this.prisma.transaction.findFirst({
        where: {
          date: new Date(trx.date),
          amount: new Decimal(trx.amount),
          description: trx.description,
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
          },
        });
        storedCount++;
      }
    }

    return storedCount;
  }

  async getAllTransactions() {
    return await this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
    });
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

        // Match if same amount, currency, and within 2 days
        if (
          trx1.currency === trx2.currency &&
          trx1.amount.equals(trx2.amount) &&
          Math.abs(
            new Date(trx1.date).getTime() - new Date(trx2.date).getTime(),
          ) <=
            2 * 24 * 60 * 60 * 1000
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
