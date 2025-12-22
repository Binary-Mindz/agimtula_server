import { Module } from '@nestjs/common';
import { AutoInvoiceImportsModule } from './auto-invoice-imports/auto-invoice-imports.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PaymentModule } from './payment/payment.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [AutoInvoiceImportsModule, ReceiptsModule, PaymentModule, ReportsModule],
})
export class UserDashboardModule {}
