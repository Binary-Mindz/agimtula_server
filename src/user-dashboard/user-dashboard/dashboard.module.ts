import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ReportsService } from '../reports/reports.service';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [DashboardController],
  providers: [DashboardService, ReportsService],
})
export class DashboardModule {}
