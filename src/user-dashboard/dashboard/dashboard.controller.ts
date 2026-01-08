import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ReportsService } from '../reports/reports.service';

@Controller('user-dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService,private readonly report:ReportsService) {}

  @Get('dashboard-data')
  @Roles('USER')
  async dashboardData(@User() user: jwtPayload) {
    return this.dashboardService.dashboardData(user.sub);
  }

  @Get("monthly-income-expense")
  @Roles('USER')
  async monthlyIncomeExpense(@User() user: jwtPayload) {
    return this.report.getReportData(user.sub);
  }
}
