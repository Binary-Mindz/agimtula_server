import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Get('all')
  @Public()
  async getAllTransactions() {
    const transactions = await this.transactionService.getAllTransactions();
    return {
      count: transactions.length,
      transactions,
    };
  }

  @Get('by-source')
  @Public()
  async getTransactionsBySource(@Query('source') source: string) {
    const transactions =
      await this.transactionService.getTransactionsBySource(source);
    return {
      source,
      count: transactions.length,
      transactions,
    };
  }
}
