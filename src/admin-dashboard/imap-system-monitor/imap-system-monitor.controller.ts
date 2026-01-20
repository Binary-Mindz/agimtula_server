import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { HasModuleAccess } from 'src/decorators/module-access.decorator';


@Controller('imap-system-monitor')
@HasModuleAccess('imap_system_monitor')
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
  @ApiOperation({
    summary: 'Admin only, allowed : all, connected, not_connected',
  })
  @ApiQuery({
    name: 'connection',
    type: 'string',
    required: false,
  })
  async getAllConnections(@Query('connection') connection: string) {
    return await this.imapSystemMonitorService.getConnections(connection);
  }

  @Get('recent-imports')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get last 10 invoice imports (Admin only)' })
  async getRecentImports() {
    return await this.imapSystemMonitorService.getRecentImports();
  }

  @Get('connection/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get connection by ID (Admin only)' })
  async getConnectionById(@Param('id') id: string) {
    return await this.imapSystemMonitorService.getConnectionById(id);
  }

  @Patch('disconnect/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Disconnect user IMAP (Admin only)' })
  async disconnectUser(@Param('id') id: string) {
    return await this.imapSystemMonitorService.disconnectUser(id);
  }
}
