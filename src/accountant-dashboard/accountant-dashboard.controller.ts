import { Controller, Get } from '@nestjs/common';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
// import { TransactionQueryDto } from './dto/TransactionQueryDto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('accountant-dashboard')
export class AccountantDashboardController {
  constructor(
    private readonly accountantDashboardService: AccountantDashboardService,
  ) {}

  @Get()
  @Roles('ACCOUNTANT')
  async fetchAccountantDashboardData(@User() user: jwtPayload) {
    return await this.accountantDashboardService.fetchAccountantDashboardData(
      user.sub,
    );
  }

  @Get('activity-feed')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get activity feed ( ACCOUNTANT )' })
  async getActivityFeed(@User() user: jwtPayload) {
    return await this.accountantDashboardService.getActivityFeed(user.sub);
  }

  @Get('workload-this-week')
  @Roles("ACCOUNTANT")
  async workloadLastSevenDay(@User() user: jwtPayload) {
    return await this.accountantDashboardService.workloadLastSevenDay(user.sub);
  }


  @Get('client-alert')
  @Roles("ACCOUNTANT")
  async clientAlerts(@User() user: jwtPayload)
  {
    return await this.accountantDashboardService.clientAlerts(user.sub)
  }

  // @Get('find-all-user/:userId')
  // @Roles('ACCOUNTANT')
  // @ApiOperation({
  //   summary: 'Get transactions for a specific user ( ACCOUNTANT )',
  // })
  // async findAll(
  //   @Param('userId') userId: string,
  //   @User() user: jwtPayload,
  //   @Query() query: TransactionQueryDto,
  // ) {
  //   return await this.accountantDashboardService.findAll(
  //     userId,
  //     user.sub,
  //     query,
  //   );
  // }


}
