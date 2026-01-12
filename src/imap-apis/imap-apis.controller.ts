import { Controller, Get } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { Public } from 'src/decorators/public.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('imap-apis')
export class ImapApisController {
  constructor(
    private readonly imapService: ImapApisService,
    private readonly transactionService: TransactionService,
  ) { }
  @Get('iii')
  @Public()
  @ApiOperation({ summary: 'Read email transactions ( PUBLIC )' })
  async readEmailByAccountTest(): Promise<any> {
    const transactions = await this.imapService.readEmailTransactions();
    await this.transactionService.storeTransactions(transactions);
    return transactions;
  }
}
