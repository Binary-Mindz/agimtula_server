import { Module } from '@nestjs/common';
import { AutoInvoiceImportsModule } from './auto-invoice-imports/auto-invoice-imports.module';
import { ReceiptsModule } from './receipts/receipts.module';

@Module({
  imports: [AutoInvoiceImportsModule, ReceiptsModule]
})
export class UserDashboardModule {}
