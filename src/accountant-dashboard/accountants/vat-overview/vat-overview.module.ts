import { Module } from '@nestjs/common';
import { VatOverviewService } from './vat-overview.service';
import { VatOverviewController } from './vat-overview.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';
import { CurrencyConverterService } from 'src/common/currency-converter.service';

@Module({
  controllers: [VatOverviewController],
  providers: [VatOverviewService, ValidateAccountantAccess, CurrencyConverterService],
})
export class VatOverviewModule {}
