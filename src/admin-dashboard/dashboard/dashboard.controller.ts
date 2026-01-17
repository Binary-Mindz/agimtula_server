import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/decorators/roles.decorator';
import { urlPrefix } from '../url-prefix';
import { ApiOperation } from '@nestjs/swagger';

@Controller(`${urlPrefix}/dashboard`)
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get dashboard data ( ADMIN only )' })
  async getData() {
    return await this.dashboardService.getData();
  }

  @Get('recent-activities')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get recent activities ( ADMIN only )' })
  async getRecentActivities() {
    return await this.dashboardService.getRecentActivities();
  }
}
