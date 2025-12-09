import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { ImapApisModule } from './imap-apis/imap-apis.module';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { AccountantDashboardModule } from './accountant-dashboard/accountant-dashboard.module';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';

@Module({
  imports: [
    DatabaseModule,
    // ImapApisModule,
    AuthModule,
    AdminDashboardModule,
    AccountantDashboardModule,
    UserDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
