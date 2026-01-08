import { Controller, Get } from '@nestjs/common';
import { ReportsAndAnalyticsService } from './reports-and-analytics.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { urlPrefix } from '../url-prefix';
import { ApiOperation } from '@nestjs/swagger';

@Controller(`${urlPrefix}/reports-and-analytics`)
export class AdminReportsAndAnalyticsController {
  constructor(
    private readonly reportsAndAnalyticsService: ReportsAndAnalyticsService,
  ) {}

  @Get('user-activity')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user activity ( ADMIN only )' })
  async userActivity() {
    return await this.reportsAndAnalyticsService.userActivity();
  }

  @Get('revenue-growth')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get revenue growth ( ADMIN only )' })
  async revenueGrowth() {
    return await this.reportsAndAnalyticsService.revenueGrowth();
  }

  @Get('subscription-trends')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get subscription trends ( ADMIN only )' })
  async subscriptionTrends() {
    return await this.reportsAndAnalyticsService.subscriptionTrends();
  }

  @Get('platform-health')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get platform health ( ADMIN only )' })
  async platformHealth() {
    return await this.reportsAndAnalyticsService.platformHealth();
  }
}
