import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapApisModule } from './imap-apis/imap-apis.module';
import { DatabaseModule } from './config/database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminRouteModule } from './admin-route/admin-route.module';
import { AccountantRouteModule } from './accountant-route/accountant-route.module';
import { UserRouteModule } from './user-route/user-route.module';

@Module({
  imports: [
    DatabaseModule,
    ImapApisModule,
    AuthModule,
    AdminRouteModule,
    AccountantRouteModule,
    UserRouteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
