import { Module } from '@nestjs/common';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { AccountantDashboardController } from './accountant-dashboard.controller';

@Module({
  controllers: [AccountantDashboardController],
  providers: [AccountantDashboardService],
})
export class AccountantDashboardModule {}
