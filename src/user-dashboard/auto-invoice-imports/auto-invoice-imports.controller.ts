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
import { JwtAccessGuard } from 'src/auth/guards/jwt/jwt-access.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';

@Controller('auto-invoice-imports')
export class AutoInvoiceImportsController {
  constructor(
    private readonly autoInvoiceImportsService: AutoInvoiceImportsService,
  ) {}

  @Patch('update-imap-connection')
  @HttpCode(201)
  @UseGuards(JwtAccessGuard, RolesGuard)
  @Roles('USER')
  @UsePipes(new ValidationPipe())
  saveImapConnection(@Body() data: ImapEmailConnectionDto) {
    return this.autoInvoiceImportsService.updateImapConnection(data);
  }
}
