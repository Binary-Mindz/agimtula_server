import { Module } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { ImapSystemMonitorController } from './imap-system-monitor.controller';

@Module({
  controllers: [ImapSystemMonitorController],
  providers: [ImapSystemMonitorService],
})
export class ImapSystemMonitorModule {}
