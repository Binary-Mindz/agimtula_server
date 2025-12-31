import { Module } from '@nestjs/common';
import { TinkController } from './tink.controller';
import { TinkService } from './tink.service';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';

@Module({
  controllers: [TinkController],
  providers: [TinkService, TransactionService],
  exports: [TinkService],
})
export class BankModule {}
