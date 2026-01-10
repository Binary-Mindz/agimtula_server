import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ValidateAccountantAccess } from '../validate-accountant-access';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ValidateAccountantAccess],
})
export class ReportsModule {}
