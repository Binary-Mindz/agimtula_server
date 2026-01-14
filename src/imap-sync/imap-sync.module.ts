import { Module } from '@nestjs/common';
import { ImapSyncService } from './imap-sync.service';
import { ImapSyncController } from './imap-sync.controller';
import { PrismaService } from 'src/config/database/prisma.service';
import { ImapApisModule } from '../imap-apis/imap-apis.module';

@Module({
  imports: [ImapApisModule],
  controllers: [ImapSyncController],
  providers: [ImapSyncService, PrismaService],
  exports: [ImapSyncService],
})
export class ImapSyncModule {}
