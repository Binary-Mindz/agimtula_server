import { Controller, Get, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiQuery } from '@nestjs/swagger';
import { PaymentStatus } from 'prisma/generated/prisma/enums';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}
  @Get('data')
  @Roles('ADMIN')
  async getPaymentData() {
    return await this.paymentsService.getPaymentData();
  }

  @Get('transactions')
  @Roles('ADMIN')
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getTransactions(
    @Query('search') search: string,
    @Query('date') date: string,
    @Query('status') status: PaymentStatus,
  ) {
    return await this.paymentsService.getTransactionsData(search, date, status);
  }
}
