import { Module } from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { AutoInvoiceImportsController } from './auto-invoice-imports.controller';

@Module({
  controllers: [AutoInvoiceImportsController],
  providers: [AutoInvoiceImportsService],
})
export class AutoInvoiceImportsModule {}
