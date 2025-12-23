import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { UserReceiptsController } from './receipts.controller';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [NestjsFormDataModule],
  controllers: [UserReceiptsController],
  providers: [ReceiptsService],
})
export class ReceiptsModule {}
