import { Module } from '@nestjs/common';
import { ReportsAndAnalyticsService } from './reports-and-analytics.service';
import { ReportsAndAnalyticsController } from './reports-and-analytics.controller';

@Module({
  controllers: [ReportsAndAnalyticsController],
  providers: [ReportsAndAnalyticsService],
})
export class ReportsAndAnalyticsModule {}
