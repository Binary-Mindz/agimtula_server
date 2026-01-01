import { Controller, Get } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('imap-apis')
export class ImapApisController {
  constructor(
    private readonly imapService: ImapApisService,
    private readonly transactionService: TransactionService,
  ) {}
  @Get('iii')
  @Public()
  async readEmailByAccountTest(): Promise<any> {
    const transactions = await this.imapService.readEmailTransactions();
    await this.transactionService.storeTransactions(transactions);
    return transactions;
  }
}
