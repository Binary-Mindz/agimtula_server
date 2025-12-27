import { Module } from '@nestjs/common';
// import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { TinkController } from './tink.controller';
import { TinkService } from './tink.service';

@Module({
  controllers: [/*BankController,*/ TinkController],
  providers: [BankService, TinkService],
  exports: [BankService, TinkService],
})
export class BankModule { }