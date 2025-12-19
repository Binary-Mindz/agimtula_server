import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [SubscriptionsModule, UsersModule, DashboardModule, UserManagementModule],
})
export class AdminDashboardModule {}
