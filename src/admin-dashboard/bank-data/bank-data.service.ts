/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';

@Injectable()
export class BankDataService {
  constructor(private prisma: PrismaService) {}

  async getAllBanks() {
    const banks = await this.prisma.bank.findMany();

    // Get transaction count for each bank
    const banksWithCount = await Promise.all(
      banks.map(async (bank) => {
        const transactionCount = await this.prisma.transaction.count({
          where: { accountId: bank.accountId },
        });
        return { ...bank, _count: { transactions: transactionCount } };
      }),
    );

    return banksWithCount;
  }

  async getBankById(id: string) {
    const bank = await this.prisma.bank.findUnique({
      where: { id },
    });

    if (!bank) return null;

    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: bank.accountId },
    });

    return {
      ...bank,
      transactions,
      _count: { transactions: transactions.length },
    };
  }

  async getBankTransactions(bankId: string) {
    const bank = await this.prisma.bank.findUnique({
      where: { id: bankId },
    });

    if (!bank?.accountId) return [];

    return await this.prisma.transaction.findMany({
      where: { accountId: bank.accountId },
      orderBy: { date: 'desc' },
    });
  }

  async matchAccountIdWithNumber(accountId: string, accountNumber: string) {
    return await this.prisma.bank.updateMany({
      where: {
        OR: [{ accountId }, { accountNumber: { contains: accountNumber } }],
      },
      data: { accountId },
    });
  }
}
