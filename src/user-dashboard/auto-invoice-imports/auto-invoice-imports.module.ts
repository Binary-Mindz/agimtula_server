import { Module } from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { AutoInvoiceImportsController } from './auto-invoice-imports.controller';
import { ManageConnectionService } from './manage-connection.service';

@Module({
  controllers: [AutoInvoiceImportsController],
  providers: [AutoInvoiceImportsService, ManageConnectionService],
})
export class AutoInvoiceImportsModule {}
