import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { UserReceiptsController } from './receipts.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [NestjsFormDataModule, ActivityLogModule],
  controllers: [UserReceiptsController],
  providers: [ReceiptsService],
})
export class ReceiptsModule {}
