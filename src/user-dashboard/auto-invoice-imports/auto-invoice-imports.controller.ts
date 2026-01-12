import {
  Body,
  Controller,
  Get,
  Patch,
  Res,
} from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { ImapEmailConnectionDto, ImapTest } from './dto/imap-email-connection.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { ManageConnectionService } from './manage-connection.service';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { urlPrefix } from '../url-prefix';
import { ImapApisService } from 'src/imap-apis/imap-apis.service';
import { Public } from 'src/decorators/public.decorator';
import { Response } from 'express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller(`${urlPrefix}/auto-invoice-imports`)
export class UserAutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
    private readonly manageConnectionService: ManageConnectionService,
    private readonly imapApisService: ImapApisService,
  ) { }

  // get invoice Auto Sync Interval data
  @Get('get-imap-configuration')
  @Roles('USER')
  @ApiOperation({ summary: 'Get IMAP configuration ( USER only )' })
  @ApiResponse({ status: 200, description: 'IMAP configuration retrieved successfully' })
  async getImapConfiguration(@User() user: jwtPayload) {
    return await this.manageConnectionService.getImapConfiguration(user.sub);
  }

  // imap configuration
  @Patch('set-imap-configuration')
  @Roles('USER')
  @ApiOperation({ summary: 'Set IMAP configuration ( USER only )' })
  @ApiResponse({ status: 200, description: 'IMAP configuration saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration or subscription required' })
  async setImapConfiguration(
    @Body() data: ImapEmailConnectionDto,
    @User() user: jwtPayload,
  ) {
    return await this.manageConnectionService.setImapConfiguration(user.sub, data);
  }

  // Disconnect Imap
  @Patch('imap-disconnect')
  @Roles('USER')
  @ApiOperation({ summary: 'Disconnect IMAP ( USER only )' })
  @ApiResponse({ status: 200, description: 'IMAP disconnected successfully' })
  async imapDisconnect(@User() user: jwtPayload) {
    return await this.manageConnectionService.imap_DisConnect(user.sub);
  }

  // imap test
  @Public()
  @Patch('imap-test')
  @ApiOperation({ summary: 'Test IMAP connection ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'IMAP connection test successful' })
  @ApiResponse({ status: 400, description: 'IMAP connection test failed' })
  async imapTest(@Body() data: ImapTest, @Res() res: Response) {
    return await this.imapApisService.testConnection(data, res);
  }

  @Public()
  @Get('imap-Connection-Test')
  @ApiOperation({ summary: 'IMAP connection test ( PUBLIC )' })
  @ApiResponse({ status: 200, description: 'IMAP connection test completed' })
  async imapConnectionTest() {
    return await this.imapApisService.imapConnectionTest();
  }
}
