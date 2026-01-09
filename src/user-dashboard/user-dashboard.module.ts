import { Module } from '@nestjs/common';
import { AutoInvoiceImportsModule } from './auto-invoice-imports/auto-invoice-imports.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { PaymentModule } from './payment/payment.module';
import { ReportsModule } from './reports/reports.module';
import { RequesteAccountantModule } from './request-accountant/request-accountant.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [AutoInvoiceImportsModule, ReceiptsModule, PaymentModule, ReportsModule, RequesteAccountantModule, InvoicesModule, DashboardModule],
})
export class UserDashboardModule { }
