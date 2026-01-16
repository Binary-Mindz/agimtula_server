import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ReportsService } from '../reports/reports.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('user-dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly report: ReportsService,
  ) {}

  @Get('dashboard-data')
  @Roles('USER')
  @ApiOperation({ summary: 'Get dashboard data ( USER only )' })
  async dashboardData(@User() user: jwtPayload) {
    return await this.dashboardService.dashboardData(user.sub);
  }

  @Get('recent-activities')
  @Roles('USER')
  @ApiOperation({ summary: 'Get recent activities ( USER only )' })
  async getRecentActivities(@User() user: jwtPayload) {
    return await this.dashboardService.getRecentActivities(user.sub);
  }

  @Get('monthly-income-expense')
  @Roles('USER')
  @ApiOperation({ summary: 'Get monthly income expense ( USER only )' })
  async monthlyIncomeExpense(@User() user: jwtPayload) {
    return await this.report.getReportData(user.sub);
  }
}
