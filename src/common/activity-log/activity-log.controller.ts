import { Controller, Get, Query } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { cResponseData } from 'src/common/cResponse';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiQuery } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly activityLog: ActivityLogService) {}

  // User dashboard activities
  @Get('user')
  @Roles('USER')
  @ApiQuery({
    required: false,
    name: 'limit',
    type: Number,
    description: 'Limit the number of activities to return',
  })
  async getUserActivities(
    @User() user: jwtPayload,
    @Query('limit') limit?: string,
  ) {
    const activities = await this.activityLog.getUserActivities(
      user.sub,
      limit ? parseInt(limit) : 20,
    );
    return cResponseData({ data: activities });
  }

  // Admin dashboard activities
  @Get('admin')
  @Roles('ADMIN')
  @ApiQuery({
    required: false,
    name: 'limit',
    type: Number,
    description: 'Limit the number of activities to return',
  })
  async getAdminActivities(@Query('limit') limit?: string) {
    const activities = await this.activityLog.getActivities(
      'ADMIN',
      limit ? parseInt(limit) : 50,
    );
    return cResponseData({ data: activities });
  }

  // System logs
  @Get('system')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @ApiQuery({
    required: false,
    name: 'limit',
    type: Number,
    description: 'Limit the number of logs to return',
  })
  async getSystemLogs(@Query('limit') limit?: string) {
    const logs = await this.activityLog.getActivities(
      'SYSTEM',
      limit ? parseInt(limit) : 100,
    );
    return cResponseData({ data: logs });
  }
}
