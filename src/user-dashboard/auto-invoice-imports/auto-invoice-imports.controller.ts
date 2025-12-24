import {
  Body,
  Controller,
  Get,
  Patch,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { ImapEmailConnectionDto, ImapTest } from './dto/imap-email-connection.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ManageConnectionService } from './manage-connection.service';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
// import { SyncSettingsDto } from './dto/sync-settings.dto';
// import { UpdateConnectionDto } from './dto/update-connection.dto';
import { urlPrefix } from '../url-prefix';
import { ImapApisService } from 'src/imap-apis/imap-apis.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { Response } from 'express';

@Controller(`${urlPrefix}/auto-invoice-imports`)
export class UserAutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
    private readonly manageConnectionService: ManageConnectionService,
    private readonly imapApisService: ImapApisService,
  ) {}

  // get invoice Auto Sync Interval data
  @Get('get-imap-configuration')
  @Roles('USER')
  getImapConfiguration(@User() user: jwtPayload) {
    return this.manageConnectionService.getImapConfiguration(user.sub);
  }

  // imap configuration
  @Patch('set-imap-configuration')
  @Roles('USER')
  @UsePipes(new ValidationPipe())
  setImapConfiguration(
    @Body() data: ImapEmailConnectionDto,
    @User() user: jwtPayload,
  ) {
    return this.manageConnectionService.setImapConfiguration(user.sub, data);
  }

  @Patch('imap-disconnect')
  @Roles('USER')
  imapDisconnect(@User() user: jwtPayload) {
    return this.manageConnectionService.imap_DisConnect(user.sub);
  }

  // imap test
  @Public()
  @Patch('imap-test')
  @UsePipes(new ValidationPipe())
  imapTest(@Body() data: ImapTest, @Res() res: Response) {
    return this.imapApisService.testConnection(data, res);
  }
}
