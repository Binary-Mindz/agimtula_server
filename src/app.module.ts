import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapApisModule } from './imap-apis/imap-apis.module';

@Module({
  imports: [ImapApisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
