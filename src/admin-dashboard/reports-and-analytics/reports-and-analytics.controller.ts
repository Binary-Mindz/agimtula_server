import { Controller, Get } from '@nestjs/common';
import { ReportsAndAnalyticsService } from './reports-and-analytics.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/reports-and-analytics`)
export class AdminReportsAndAnalyticsController {
  constructor(
    private readonly reportsAndAnalyticsService: ReportsAndAnalyticsService,
  ) {}

  @Get('user-activity')
  @Roles('ADMIN')
  async userActivity() {
    return await this.reportsAndAnalyticsService.userActivity();
  }

  @Get('revenue-growth')
  @Roles('ADMIN')
  async revenueGrowth() {
    return await this.reportsAndAnalyticsService.revenueGrowth();
  }

  @Get('subscription-trends')
  @Roles('ADMIN')
  async subscriptionTrends() {
    return await this.reportsAndAnalyticsService.subscriptionTrends();
  }

  @Get('platform-health')
  @Roles('ADMIN')
  async platformHealth() {
    return await this.reportsAndAnalyticsService.platformHealth();
  }
}
