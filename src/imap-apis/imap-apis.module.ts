import { Module } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CronConfigService } from './cronConfig.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [],
  providers: [ImapApisService, CronConfigService],
  exports: [ImapApisService],
})
export class ImapApisModule {}
