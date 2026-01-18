import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('supplier-imports')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
  ) {}

  @Get('activity')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get supplier activity ( ADMIN only )' })
  async getActivity() {
    return this.reports.getActivity();
  }

  @Get('recent-users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get recent users ( ADMIN only )' })
  async getRecentUsers() {
    return this.reports.getRecentUsers();
  }

  @Get('system-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system logs ( ADMIN only )' })
  async getSystemLogs() {
    return this.reports.getSystemLogs();
  }
}
