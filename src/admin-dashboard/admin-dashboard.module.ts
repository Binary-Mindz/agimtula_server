import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';
import { ReportsAndAnalyticsModule } from './reports-and-analytics/reports-and-analytics.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { BankDataModule } from './bank-data/bank-data.module';
import { AccountantRequestsModule } from './accountant-requests/accountant-requests.module';
import { AccountantsModule } from './accountants/accountants.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { ProfileSettingsModule } from './profile-settings/profile-settings.module';
import { ImapSystemMonitorModule } from './imap-system-monitor/imap-system-monitor.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [SubscriptionsModule, DashboardModule, UserManagementModule, ReportsAndAnalyticsModule, SystemSettingsModule, ReportsModule, BankDataModule, AccountantRequestsModule, AccountantsModule, SupportTicketsModule, ProfileSettingsModule, ImapSystemMonitorModule],
})
export class AdminDashboardModule { }
