import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/config/database/prisma.service';
import { cResponseData } from 'src/common/cResponse';

@Injectable()
export class BankDataService {
  constructor(private prisma: PrismaService) {}

  async getAllBanks() {
    try {
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

      return cResponseData({
        data: banksWithCount,
        message: 'Banks retrieved successfully',
      });
    } catch (error) {
      console.error('Get all banks error:', error);
      throw new HttpException(
        'Failed to retrieve banks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBankById(id: string) {
    try {
      const bank = await this.prisma.bank.findUnique({
        where: { id },
      });

      if (!bank) {
        throw new HttpException('Bank not found', HttpStatus.NOT_FOUND);
      }

      const transactions = await this.prisma.transaction.findMany({
        where: { accountId: bank.accountId },
      });

      return cResponseData({
        data: {
          ...bank,
          transactions,
          _count: { transactions: transactions.length },
        },
        message: 'Bank retrieved successfully',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get bank by ID error:', error);
      throw new HttpException(
        'Failed to retrieve bank',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBankTransactions(bankId: string) {
    try {
      const bank = await this.prisma.bank.findUnique({
        where: { id: bankId },
      });

      if (!bank?.accountId) {
        throw new HttpException(
          'Bank not found or no account ID',
          HttpStatus.NOT_FOUND,
        );
      }

      const transactions = await this.prisma.transaction.findMany({
        where: { accountId: bank.accountId },
        orderBy: { date: 'desc' },
      });

      return cResponseData({
        data: transactions,
        message: 'Bank transactions retrieved successfully',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Get bank transactions error:', error);
      throw new HttpException(
        'Failed to retrieve bank transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async matchAccountIdWithNumber(accountId: string, accountNumber: string) {
    try {
      const result = await this.prisma.bank.updateMany({
        where: {
          OR: [{ accountId }, { accountNumber: { contains: accountNumber } }],
        },
        data: { accountId },
      });

      return cResponseData({
        data: result,
        message: 'Account ID matched successfully',
      });
    } catch (error) {
      console.error('Match account ID error:', error);
      throw new HttpException(
        'Failed to match account ID',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
