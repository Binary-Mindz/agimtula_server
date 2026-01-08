import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReceiptExpenseService } from './receipt-expense.service';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

@Controller('receipt-expense')
export class ReceiptExpenseController {
  constructor(private readonly receiptExpenseService: ReceiptExpenseService) {}

  @Get(':userId/total')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', type: String })
  async getTotalExpense(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.receiptExpenseService.getTotalExpense(userId, user.sub);
  }

  @Get(':userId/list')
  @Roles('ACCOUNTANT')
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
}
