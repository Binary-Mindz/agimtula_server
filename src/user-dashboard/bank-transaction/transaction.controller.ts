import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';



@Controller('transactions')
export class TransactionController {
  constructor(private transactionService: TransactionService) { }

  @Get('all')
  @Public()
  @ApiOperation({ summary: 'Get all transactions ( PUBLIC )' })
  async getAllTransactions() {
    const transactions = await this.transactionService.getAllTransactions();
    return {
      count: transactions.length,
      transactions,
    };
  }
  @Get('all-for-user')
  @UseGuards(AuthGuard)
  @Roles('USER')
  @ApiOperation({ summary: 'Get all user transactions ( USER only )' })
  async getAllUserTransactions(
    @User() user: jwtPayload
  ) {
    const transactions = await this.transactionService.getAllUserTransactions(user.sub);
    return {
      transactions,
    };
  }
  @Get('by-source')
  @Public()
  @ApiOperation({ summary: 'Get transactions by source ( PUBLIC )' })
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
