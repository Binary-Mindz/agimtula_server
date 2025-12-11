import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapApisModule } from './imap-apis/imap-apis.module';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { AccountantDashboardModule } from './accountant-dashboard/accountant-dashboard.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { SmtpMailModule } from './config/smtp-mail/smtp-mail.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ImapApisModule,
    AuthModule,
    AdminDashboardModule,
    AccountantDashboardModule,
    UserDashboardModule,
    SmtpMailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
