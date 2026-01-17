import { Controller, Get } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { ApiOperation } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { Roles } from 'src/decorators/roles.decorator';
import { CronConfigService } from './cronConfig.service';

@Controller('imap-apis')
export class ImapApisController {
  constructor(
    private readonly imapService: ImapApisService,
    private readonly cronConfigService: CronConfigService,
  ) {}
  
  @Get('iii')
  @Roles('USER')
  @ApiOperation({ summary: 'Read email transactions ( PUBLIC )' })
  async readEmailByAccountTest(@User() user?: jwtPayload): Promise<any> {
    const userId = user?.sub || 'test-user-id';
    const transactions = await this.imapService.readEmailTransactions(userId);
    return transactions;
  }

  @Get('debug/cron-jobs')
  @ApiOperation({ summary: 'List all active cron jobs for debugging' })
  async listActiveCronJobs() {
    const jobs = this.cronConfigService.listAllCronJobs();
    return { activeCronJobs: jobs };
  }
}
