import { Module } from '@nestjs/common';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { SmtpMailModule } from './config/smtp-mail/smtp-mail.module';
import { ConfigModule } from '@nestjs/config';
import { MileageModule } from './user-dashboard/mileage/mileage.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from './user-dashboard/settings/settings.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RedisServiceModule } from './config/redis-service/redis-service.module';
import { BankModule } from './bank/bank.module';
import { ImapApisModule } from './imap-apis/imap-apis.module';
import { BankTransactionModule } from './user-dashboard/bank-transaction/transaction.module';
import { BankDataModule } from './admin-dashboard/bank-data/bank-data.module';
import { QuotationsModule } from './user-dashboard/quotations/quotations.module';
import { PaymentsModule } from './admin-dashboard/payments/payments.module';
import { LoggerModule } from './common/logger/logger.module';
import { AccountantDashboardModule } from './accountant-dashboard/accountant-dashboard.module';
import { AccountantSettingsModule } from './accountant-dashboard/accountants/accountant-settings/accountant-settings.module';
import { PurchaseManagementModule } from './accountant-dashboard/accountants/purchase-management/purchase-management.module';
import { SalesInvoicesModule } from './accountant-dashboard/accountants/sales-invoices/sales-invoices.module';
import { DashboardModule } from './user-dashboard/dashboard/dashboard.module';
import { ReceiptExpenseModule } from './accountant-dashboard/accountants/receipt-expense/receipt-expense.module';
import { VatOverviewModule } from './accountant-dashboard/accountants/vat-overview/vat-overview.module';
import { ClientsModule } from './accountant-dashboard/accountants/clients/clients.module';
import { ReportsModule } from './accountant-dashboard/accountants/reports/reports.module';
import { ImapSyncModule } from './imap-sync/imap-sync.module';

@Module({
  imports: [
    RedisServiceModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    AdminDashboardModule,
    UserDashboardModule,
    SmtpMailModule,
    MileageModule,
    SettingsModule,
    BankModule,
    ImapApisModule,
    BankTransactionModule,
    BankDataModule,
    QuotationsModule,
    PaymentsModule,
    LoggerModule,
    AccountantDashboardModule,
    AccountantSettingsModule,
    PurchaseManagementModule,
    SalesInvoicesModule,
    DashboardModule,
    ReceiptExpenseModule,
    VatOverviewModule,
    ClientsModule,
    ReportsModule,
    ImapSyncModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule { }
