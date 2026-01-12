import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { PaymentStatus } from 'prisma/generated/prisma/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get('data')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get payment data ( ADMIN only )' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment data fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch payment data',
  })
  async getPaymentData() {
    return await this.paymentsService.getPaymentData();
  }

  @Get('transactions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get transactions ( ADMIN only )' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to fetch transactions',
  })
  async getTransactions(
    @Query('search') search: string,
    @Query('date') date: string,
    @Query('status') status: PaymentStatus,
  ) {
    return await this.paymentsService.getTransactionsData(search, date, status);
  }
}
