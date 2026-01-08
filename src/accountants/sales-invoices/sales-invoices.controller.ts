import { Controller, Get, Param } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiParam } from '@nestjs/swagger';

@Controller('sales-invoices')
export class SalesInvoicesController {
  constructor(private readonly salesInvoicesService: SalesInvoicesService) {}

  @Get('sales-invoices-data/:userId')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoicesData(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.salesInvoicesService.getSalesInvoicesData(user.sub, userId);
  }

  @Get('sales-invoices/:userId')
  @Roles('ACCOUNTANT')
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoices(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return this.salesInvoicesService.getSalesInvoices(user.sub, userId);
  }
}
