import { Module } from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { UserAutoInvoiceImportsController } from './auto-invoice-imports.controller';
import { ManageConnectionService } from './manage-connection.service';
import { ImapApisModule } from 'src/imap-apis/imap-apis.module';

@Module({
  imports: [ImapApisModule],
  controllers: [UserAutoInvoiceImportsController],
  providers: [AutoInvoiceImportsService, ManageConnectionService],
})
export class AutoInvoiceImportsModule {}
