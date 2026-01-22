import { Module } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { ImapSystemMonitorController } from './imap-system-monitor.controller';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { ManageConnectionService } from 'src/user-dashboard/auto-invoice-imports/manage-connection.service';
import { CronConfigService } from 'src/imap-apis/cronConfig.service';
import { ImapApisService } from 'src/imap-apis/imap-apis.service';
import { StripeService } from 'src/user-dashboard/payment/stripe.service';

@Module({
  imports: [ActivityLogModule],
  controllers: [ImapSystemMonitorController],
  providers: [ImapSystemMonitorService,ManageConnectionService,CronConfigService,ImapApisService,StripeService],
  exports: [ImapSystemMonitorService],
})
export class ImapSystemMonitorModule {}
