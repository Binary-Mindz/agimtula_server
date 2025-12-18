import { Module } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [ImapApisService],
  exports: [ImapApisService],
})
export class ImapApisModule {}
