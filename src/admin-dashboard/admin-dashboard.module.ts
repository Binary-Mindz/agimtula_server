import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';
import { ReportsAndAnalyticsModule } from './reports-and-analytics/reports-and-analytics.module';

@Module({
  imports: [SubscriptionsModule, DashboardModule, UserManagementModule, ReportsAndAnalyticsModule],
})
export class AdminDashboardModule { }
