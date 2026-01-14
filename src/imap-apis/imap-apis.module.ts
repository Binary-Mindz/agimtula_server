import { Module } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronConfigService } from './cronConfig.service';
import { ImapApisController } from './imap-apis.controller';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ImapApisController],
  providers: [ImapApisService, CronConfigService, TransactionService],
  exports: [ImapApisService, CronConfigService],
})
export class ImapApisModule {}
