import { Module } from '@nestjs/common';
import { TinkController } from './tink.controller';
import { TinkService } from './tink.service';

@Module({
  controllers: [TinkController],
  providers: [TinkService],
  exports: [TinkService],
})
export class BankModule { }