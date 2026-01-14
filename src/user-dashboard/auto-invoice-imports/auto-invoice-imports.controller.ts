import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { ManageConnectionService } from './manage-connection.service';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { urlPrefix } from '../url-prefix';
import { ImapApisService } from 'src/imap-apis/imap-apis.service';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ImapSyncService } from './imap-sync.service';
import { cResponseData } from 'src/common/cResponse';

@Controller(`${urlPrefix}/auto-invoice-imports`)
export class UserAutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
    private readonly manageConnectionService: ManageConnectionService,
    private readonly imapApisService: ImapApisService,
    private readonly imapSyncService: ImapSyncService,
  ) {}

  // get invoice Auto Sync Interval data
  @Get('get-imap-configuration')
  @Roles('USER')
  @ApiOperation({ summary: 'Get IMAP configuration ( USER only )' })
  @ApiResponse({
    status: 200,
    description: 'IMAP configuration retrieved successfully',
  })
  async getImapConfiguration(@User() user: jwtPayload) {
    return await this.manageConnectionService.getImapConfiguration(user.sub);
  }

  // imap configuration
  @Patch('set-imap-configuration')
  @Roles('USER')
  @ApiOperation({ summary: 'Set IMAP configuration ( USER only )' })
  @ApiResponse({
    status: 200,
    description: 'IMAP configuration saved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid configuration or subscription required',
  })
  async setImapConfiguration(
    @Body() data: ImapEmailConnectionDto,
    @User() user: jwtPayload,
  ) {
    return await this.manageConnectionService.setImapConfiguration(
      user.sub,
      data,
    );
  }

  // Disconnect Imap
  @Patch('imap-disconnect')
  @Roles('USER')
  @ApiOperation({ summary: 'Disconnect IMAP ( USER only )' })
  @ApiResponse({ status: 200, description: 'IMAP disconnected successfully' })
  async imapDisconnect(@User() user: jwtPayload) {
    return await this.manageConnectionService.imap_DisConnect(user.sub);
  }

  // get method dashboard

  @Get('auto-invoice-retrival-dashboard')
  @Roles('USER')
  @ApiOperation({ summary: 'Auto invoice retrival dashboard ( USER only )' })
  @ApiResponse({
    status: 200,
    description: 'Auto invoice retrival dashboard data retrieved successfully',
  })
  async autoInvoiceRetrivalDashboard(@User() user: jwtPayload) {
    return await this.autoInvoiceImportsService.autoInvoiceRetrivalDashboard(
      user.sub,
    );
  }

  @Get('view-or-download/:invoiceId')
  @Roles('USER')
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiOperation({ summary: 'View or download invoice ( USER only )' })
  @ApiResponse({ status: 200, description: 'Invoice fetched successfully' })
  async viewOrDownload(
    @Param('invoiceId') invoiceId: string,
    @User() user: jwtPayload,
  ) {
    return this.autoInvoiceImportsService.viewOrDownload(invoiceId, user.sub);
  }

  // syncing
  @Post('sync')
  @Roles('USER')
  @ApiOperation({ summary: 'Sync emails ( USER only )' })
  @ApiResponse({ status: 200, description: 'Email sync completed' })
  async syncEmails(@User() user: jwtPayload) {
    const invoices = await this.imapSyncService.syncEmails(user.sub);
    return cResponseData({
      message: 'Email sync completed',
      data: invoices,
    });
  }

  @Get('status')
  @Roles('USER')
  @ApiOperation({ summary: 'Get sync status ( USER only )' })
  @ApiResponse({ status: 200, description: 'Sync status retrieved' })
  async getSyncStatus(@User() user: jwtPayload) {
    const status = await this.imapSyncService.getLastSyncInfo(user.sub);
    return cResponseData({
      message: 'Sync status retrieved',
      data: status,
    });
  }

  @Post('reset')
  @Roles('USER')
  @ApiOperation({ summary: 'Reset last sync ( USER only )' })
  @ApiResponse({ status: 200, description: 'Last sync reset successfully' })
  async resetLastSync(@User() user: jwtPayload) {
    const result = await this.imapSyncService.resetLastSync(user.sub);
    return cResponseData({
      message: 'Last sync reset successfully',
      data: result,
    });
  }
}
