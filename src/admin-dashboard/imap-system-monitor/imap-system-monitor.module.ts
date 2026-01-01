import { Module } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { AdminImapSystemMonitorController } from './imap-system-monitor.controller';

@Module({
  controllers: [AdminImapSystemMonitorController],
  providers: [ImapSystemMonitorService],
})
export class ImapSystemMonitorModule {}
