import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { urlPrefix } from '../url-prefix';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller(`${urlPrefix}reports`)
export class UserReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('report-summury')
  @Roles('USER')
  @ApiOperation({ summary: 'Get report summary ( USER only )' })
  @ApiResponse({ status: 200, description: 'Report summary retrieved successfully' })
  getReportSummury(@User() user: jwtPayload) {
    return this.reportsService.getReportData(user.sub);
  }
}
