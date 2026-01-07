import { Controller, Get, Query } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiParam } from '@nestjs/swagger';

@Controller('sales-invoices')
export class SalesInvoicesController {
  constructor(private readonly salesInvoicesService: SalesInvoicesService) {}

  @Get('sales-invoices-data')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoicesData(
    @User() user: jwtPayload,
    @Query('userId') userId: string,
  ) {
    return this.salesInvoicesService.getSalesInvoicesData(user.sub, userId);
  }

  @Get('sales-invoices')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoices(
    @User() user: jwtPayload,
    @Query('userId') userId: string,
  ) {
    return this.salesInvoicesService.getSalesInvoices(user.sub, userId);
  }
}
