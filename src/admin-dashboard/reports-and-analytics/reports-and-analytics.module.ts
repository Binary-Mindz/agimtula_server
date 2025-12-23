import { Module } from '@nestjs/common';
import { ReportsAndAnalyticsService } from './reports-and-analytics.service';
import { AdminReportsAndAnalyticsController } from './reports-and-analytics.controller';

@Module({
  controllers: [AdminReportsAndAnalyticsController],
  providers: [ReportsAndAnalyticsService],
})
export class ReportsAndAnalyticsModule {}
