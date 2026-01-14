import { Controller, Post, Get } from '@nestjs/common';
import { ImapSyncService } from './imap-sync.service';
import { cResponseData } from 'src/common/cResponse';
import { Roles } from 'src/decorators/roles.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';

@Controller('imap-sync')
export class ImapSyncController {
  constructor(private readonly imapSyncService: ImapSyncService) {}

  @Post('sync')
  @Roles('USER')
  async syncEmails(@User() user: jwtPayload) {
    const invoices = await this.imapSyncService.syncEmails(user.sub);
    return cResponseData({
      message: 'Email sync completed',
      data: invoices,
    });
  }

  @Get('status')
  @Roles('USER')
  async getSyncStatus(@User() user: jwtPayload) {
    const status = await this.imapSyncService.getLastSyncInfo(user.sub);
    return cResponseData({
      message: 'Sync status retrieved',
      data: status,
    });
  }

  @Post('reset')
  @Roles('USER')
  async resetLastSync(@User() user: jwtPayload) {
    const result = await this.imapSyncService.resetLastSync(user.sub);
    return cResponseData({
      message: 'Last sync reset successfully',
      data: result,
    });
  }
}
