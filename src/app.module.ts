import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { AccountantDashboardModule } from './accountant-dashboard/accountant-dashboard.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { SmtpMailModule } from './config/smtp-mail/smtp-mail.module';
import { ConfigModule } from '@nestjs/config';
import { MileageModule } from './user-dashboard/mileage/mileage.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from './user-dashboard/settings/settings.module';
import { AuthGuard } from './auth/guards/auth/auth.guard';
import { RedisServiceModule } from './config/redis-service/redis-service.module';
import { BankModule } from './bank/bank.module';
import { ImapApisModule } from './imap-apis/imap-apis.module';

@Module({
  imports: [
    RedisServiceModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    AdminDashboardModule,
    AccountantDashboardModule,
    UserDashboardModule,
    SmtpMailModule,
    MileageModule,
    SettingsModule,
    BankModule,
    ImapApisModule,
    // PaymentsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_GUARD',
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
