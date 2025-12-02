import { Module } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';

@Module({
  controllers: [],
  providers: [ImapApisService],
  exports: [ImapApisService],
})
export class ImapApisModule {}
