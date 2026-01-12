import { Controller, Get, Param } from '@nestjs/common';
import { VatOverviewService } from './vat-overview.service';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('vat-overview')
export class VatOverviewController {
  constructor(private readonly vatOverviewService: VatOverviewService) { }

  @Get(':userId/summary')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get VAT summary ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: 'string' })
  async getSummary(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.vatOverviewService.getSummary(userId, user.sub);
  }

  @Get(':userId/breakdown')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get VAT breakdown ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: 'string' })
  async getBreakdown(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.vatOverviewService.getBreakdown(userId, user.sub);
  }

  @Get(':userId/export')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get all VAT data ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: 'string' })
  async getAllVatData(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.vatOverviewService.getAllVatData(userId, user.sub);
  }
}
