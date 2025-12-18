import {
  Body,
  Controller,
  HttpCode,
  Patch,
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

@Controller('auto-invoice-imports')
export class AutoInvoiceImportsController {
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

  @Patch('user-subscription')
  @HttpCode(200)
  @Roles('USER', 'ADMIN', 'ACCOUNTANT')
  @UsePipes(new ValidationPipe())
  saveImapConfiguration(
    @Body() dto: ImapEmailConnectionDto,
    @User() user: jwtPayload,
  ) {
    return this.manageConnectionService.userSubscription(user.sub, dto);
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
