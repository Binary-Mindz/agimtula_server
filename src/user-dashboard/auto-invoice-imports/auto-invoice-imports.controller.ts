import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ManageConnectionService } from './manage-connection.service';
import { User } from 'src/auth/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { SyncSettingsDto } from './dto/sync-settings.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { urlPrefix } from '../uel-prefix';

@Controller(`${urlPrefix}/auto-invoice-imports`)
export class UserAutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
    private readonly manageConnectionService: ManageConnectionService,
  ) {}

  @Patch('update-imap-connection')
  @HttpCode(201)
  @Roles('USER')
  @UsePipes(new ValidationPipe())
  saveImapConnection(@Body() data: ImapEmailConnectionDto) {
    return this.autoInvoiceImportsService.updateImapConnection(data);
  }

  // imap configuration

  @Post('user-subscription')
  @HttpCode(200)
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  saveImapConfiguration(
    @Body() dto: ImapEmailConnectionDto,
    @User() user: jwtPayload,
  ) {
    return this.manageConnectionService.userSubscription(user.sub, dto);
  }

  @Patch('update-connection')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  updateConnection(@Body() dto: UpdateConnectionDto, @User() user: jwtPayload) {
    return this.manageConnectionService.updateConnection(user.sub, dto);
  }

  @Delete('disconnect-connection')
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  disconnectConnection(@User() user: jwtPayload) {
    return this.manageConnectionService.disconnectConnection(user.sub);
  }

  // sync settings
  @Patch('sync-settings')
  @HttpCode(200)
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  saveSyncSettings(@Body() dto: SyncSettingsDto, @User() user: jwtPayload) {
    return this.manageConnectionService.syncSettings(user.sub, dto);
  }
}
