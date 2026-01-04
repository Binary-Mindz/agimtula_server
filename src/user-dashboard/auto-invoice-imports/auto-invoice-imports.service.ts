import { Injectable, BadRequestException } from '@nestjs/common';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';

@Injectable()
export class AutoInvoiceImportsService {
  updateImapConnection(data: ImapEmailConnectionDto) {
    if (!data) {
      throw new BadRequestException('Invalid IMAP connection data');
    }
    return {
      message: 'IMAP connection updated successfully',
      data,
    };
  }
}
