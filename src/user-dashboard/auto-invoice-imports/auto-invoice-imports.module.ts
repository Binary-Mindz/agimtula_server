import { Module } from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { UserAutoInvoiceImportsController } from './auto-invoice-imports.controller';
import { ManageConnectionService } from './manage-connection.service';
import { ImapApisModule } from 'src/imap-apis/imap-apis.module';
import { ImapSyncService } from './imap-sync.service';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ImapApisModule, ActivityLogModule],
  controllers: [UserAutoInvoiceImportsController],
  providers: [
    AutoInvoiceImportsService,
    ManageConnectionService,
    ImapSyncService,
  ],
})
export class AutoInvoiceImportsModule {}
