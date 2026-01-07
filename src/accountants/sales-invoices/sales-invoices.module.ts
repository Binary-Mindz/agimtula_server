import { Module } from '@nestjs/common';
import { SalesInvoicesService } from './sales-invoices.service';
import { SalesInvoicesController } from './sales-invoices.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';

@Module({
  controllers: [SalesInvoicesController],
  providers: [SalesInvoicesService, ValidateAccountantAccess],
})
export class SalesInvoicesModule {}
