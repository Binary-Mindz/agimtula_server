import {
  Body,
  Controller,
  HttpCode,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AutoInvoiceImportsService } from './auto-invoice-imports.service';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('auto-invoice-imports')
export class AutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
  ) {}

  @Patch('update-imap-connection')
  @HttpCode(201)
  @Roles('USER')
  @UsePipes(new ValidationPipe())
  saveImapConnection(@Body() data: ImapEmailConnectionDto) {
    return this.autoInvoiceImportsService.updateImapConnection(data);
  }
}
