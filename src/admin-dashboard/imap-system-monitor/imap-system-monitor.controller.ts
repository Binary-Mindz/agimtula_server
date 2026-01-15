import { Controller, Get } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('imap-system-monitor')
export class ImapSystemMonitorController {
  constructor(
    private readonly imapSystemMonitorService: ImapSystemMonitorService,
  ) {}

  @Get('getImapSystemData')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin only' })
  async getImapSystemMonitorData() {
    return await this.imapSystemMonitorService.getImapConnectionData();
  }

  @Get('getConnections')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin only' })
  async getAllConnections() {
    return await this.imapSystemMonitorService.getConnections();
  }
}
