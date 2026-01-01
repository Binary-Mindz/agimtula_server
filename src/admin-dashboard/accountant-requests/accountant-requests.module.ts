import { Module } from '@nestjs/common';
import { AccountantRequestsService } from './accountant-requests.service';
import { AccountantRequestsController } from './accountant-requests.controller';

@Module({
  controllers: [AccountantRequestsController],
  providers: [AccountantRequestsService],
})
export class AccountantRequestsModule {}
