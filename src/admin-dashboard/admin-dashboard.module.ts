import { Module } from '@nestjs/common';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [SubscriptionsModule, UsersModule],
})
export class AdminDashboardModule {}
