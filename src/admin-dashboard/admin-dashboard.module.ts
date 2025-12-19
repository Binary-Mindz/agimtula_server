import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CustomUserModule } from './custom-user/custom-user.module';

@Module({
  imports: [SubscriptionsModule, UsersModule, DashboardModule, CustomUserModule],
})
export class AdminDashboardModule {}
