import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { UserReportsController } from './reports.controller';

@Module({
  controllers: [UserReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
