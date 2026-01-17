import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
