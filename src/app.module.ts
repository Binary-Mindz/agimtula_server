import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { QuotationsModule } from './quotations/quotations.module';
import { WebhookController } from './webhook/webhook.controller';
import { PaymentsModule } from './admin-dashboard/payments/payments.module';
import { LoggerModule } from './logger/logger.module';
import { AccountantDashboardModule } from './accountant-dashboard/accountant-dashboard.module';
import { AccountantSettingsModule } from './accountants/accountant-settings/accountant-settings.module';
import { PurchaseManagementModule } from './accountants/purchase-management/purchase-management.module';
import { SalesInvoicesModule } from './accountants/sales-invoices/sales-invoices.module';

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
    // PaymentsModule
    AccountantSettingsModule,
    PurchaseManagementModule,
    SalesInvoicesModule,
  ],
  controllers: [AppController, WebhookController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
