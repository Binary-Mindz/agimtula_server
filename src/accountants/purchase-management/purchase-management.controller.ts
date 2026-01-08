import { Controller, Get, Param, Query } from '@nestjs/common';
import { PurchaseManagementService } from './purchase-management.service';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('purchase-management')
export class PurchaseManagementController {
  constructor(
    private readonly purchaseManagementService: PurchaseManagementService,
  ) {}

  @Get('data/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get purchase data ( ACCOUNTANT only )' })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  async getPurchaseData(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.purchaseManagementService.getPurchaseData(
      userId,
      user.sub,
    );
  }

  @Get('history/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get purchase history ( ACCOUNTANT only )' })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getPurchaseHistory(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return await this.purchaseManagementService.getPurchaseHistory(
      userId,
      user.sub,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
      search,
    );
  }

  @Get('detailed-report/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get purchase detailed report ( ACCOUNTANT only )' })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  @ApiQuery({
    name: 'purchaseId',
    type: String,
  })
  async getPurchaseDetailedReport(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
    @Query('purchaseId') purchaseId: string,
  ) {
    return await this.purchaseManagementService.getPurchaseDetailedReport(
      userId,
      user.sub,
      purchaseId,
    );
  }
}
