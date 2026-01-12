import { Controller, Get, Param } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('sales-invoices')
export class SalesInvoicesController {
  constructor(private readonly salesInvoicesService: SalesInvoicesService) { }

  @Get('sales-invoices-data/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get sales invoices data ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoicesData(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.salesInvoicesService.getSalesInvoicesData(user.sub, userId);
  }

  @Get('sales-invoices/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get sales invoices ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', required: true })
  async getSalesInvoices(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
  ) {
    return await this.salesInvoicesService.getSalesInvoices(user.sub, userId);
  }

  @Get('sales-invoices/:userId/:salesId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Get sales invoices ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', required: true })
  @ApiParam({ name: 'salesId', required: true })
  async getData(
    @User() user: jwtPayload,
    @Param('userId') userId: string,
    @Param('salesId') salesId: string,
  ) {
    return await this.salesInvoicesService.getData(user.sub, userId, salesId);
  }

  @Get('export-data/:userId')
  @Roles('ACCOUNTANT')
  @ApiOperation({ summary: 'Export sales invoices data ( ACCOUNTANT only )' })
  @ApiParam({ name: 'userId', required: true })
  async exportData(@Param('userId') userId: string, @User() user: jwtPayload) {
    const accountantId = user.sub;

    return await this.salesInvoicesService.exportData(userId, accountantId);
  }
}
