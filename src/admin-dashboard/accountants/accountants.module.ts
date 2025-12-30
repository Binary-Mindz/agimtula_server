import { Module } from '@nestjs/common';
import { AccountantsService } from './accountants.service';
import { AccountantsController } from './accountants.controller';

@Module({
  controllers: [AccountantsController],
  providers: [AccountantsService],
})
export class AccountantsModule {}
