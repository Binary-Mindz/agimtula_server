import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReceiptExpenseService } from './receipt-expense.service';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('receipt-expense')
export class ReceiptExpenseController {
  constructor(private readonly receiptExpenseService: ReceiptExpenseService) { }

  @Get(':userId/total')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get total expense ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: String })
  async getTotalExpense(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.receiptExpenseService.getTotalExpense(userId, user.sub);
  }

  @Get(':userId/list')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get receipt and mileage list ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getReceiptAndMileage(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return await this.receiptExpenseService.getReceiptAndMileage(
      userId,
      user.sub,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      sortBy || 'createdAt',
      sortOrder || 'desc',
    );
  }

  @Get('export-data/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({
    summary: 'Export receipt and mileage data ( ACCOUNTANT only )',
  })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  async exportData(@Param('userId') userId: string, @User() user: jwtPayload) {
    const accountantId = user.sub;

    return await this.receiptExpenseService.exportData(userId, accountantId);
  }

  @Get(':userId/detailed-report')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get detailed report ( ACCOUNTANT only )' })
  @ApiParam({
    name: 'userId',
    type: String,
  })
  @ApiQuery({
    name: 'receiptId',
    type: String,
  })
  async getDetailedReport(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
    @Query('receiptId') receiptId: string,
  ) {
    return await this.receiptExpenseService.getData(
      userId,
      user.sub,
      receiptId,
    );
  }
}
