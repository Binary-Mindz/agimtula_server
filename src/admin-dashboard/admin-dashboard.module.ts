import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UserManagementModule } from './user-management/user-management.module';
import { ReportsAndAnalyticsModule } from './reports-and-analytics/reports-and-analytics.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { SupplierImportsModule } from './supplier-imports/supplier-imports.module';
import { BankDataModule } from './bank-data/bank-data.module';
import { AccountantRequestsModule } from './accountant-requests/accountant-requests.module';
import { AccountantsModule } from './accountants/accountants.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { ProfileSettingsModule } from './profile-settings/profile-settings.module';

@Module({
  imports: [SubscriptionsModule, DashboardModule, UserManagementModule, ReportsAndAnalyticsModule, SystemSettingsModule, SupplierImportsModule, BankDataModule, AccountantRequestsModule, AccountantsModule, SupportTicketsModule, ProfileSettingsModule],
})
export class AdminDashboardModule { }
