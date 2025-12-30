import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';
import { ReportsAndAnalyticsModule } from './reports-and-analytics/reports-and-analytics.module';
import { ImapSystemMonitorModule } from './imap-system-monitor/imap-system-monitor.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { SupplierImportsModule } from './supplier-imports/supplier-imports.module';
import { BankDataModule } from './bank-data/bank-data.module';

@Module({
  imports: [SubscriptionsModule, DashboardModule, UserManagementModule, ReportsAndAnalyticsModule, ImapSystemMonitorModule, SystemSettingsModule, SupplierImportsModule, BankDataModule],
})
export class AdminDashboardModule { }
