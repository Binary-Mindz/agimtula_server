import { Module } from '@nestjs/common';
import { TinkController } from './tink.controller';
import { TinkService } from './tink.service';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { BankStatementController } from './bank-statement.controller';
import { BankStatementService } from './bank-statement.service';
import { MT940Parser } from './parsers/mt940.parser';
import { CAMT053Parser } from './parsers/camt053.parser';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';

@Module({
  controllers: [TinkController, BankStatementController],
  providers: [
    TinkService,
    TransactionService,
    BankStatementService,
    MT940Parser,
    CAMT053Parser,
    ActivityLogService,
  ],
  exports: [TinkService],
})
export class BankModule {}
