import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { TransactionQueryDto } from './dto/TransactionQueryDto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('accountant-dashboard')
export class AccountantDashboardController {
  constructor(
    private readonly accountantDashboardService: AccountantDashboardService
  ) { }

  @Get(':userId')
  @UseGuards(AuthGuard)
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get accountant dashboard data ( ACCOUNTANT only )' })
  async findAll(
    @Param('userId') userId: string,
    @User() user: jwtPayload,
    @Query() query: TransactionQueryDto
  ) {
    return await this.accountantDashboardService.findAll(
      userId,
      user.sub,
      query
    );
  }
}
