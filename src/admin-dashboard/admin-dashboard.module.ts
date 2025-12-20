import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';

@Module({
  imports: [SubscriptionsModule, DashboardModule, UserManagementModule],
})
export class AdminDashboardModule {}
