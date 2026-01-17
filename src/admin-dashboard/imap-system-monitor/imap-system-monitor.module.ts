import { Module } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { ImapSystemMonitorController } from './imap-system-monitor.controller';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [ImapSystemMonitorController],
  providers: [ImapSystemMonitorService],
})
export class ImapSystemMonitorModule {}
