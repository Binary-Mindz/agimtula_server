import { Injectable } from '@nestjs/common';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';
import { ValidationException } from 'src/common/app-exceptions';

@Injectable()
export class AutoInvoiceImportsService {
  updateImapConnection(data: ImapEmailConnectionDto) {
    if (!data) {
      throw new ValidationException('Invalid IMAP connection data');
    }
    return {
      message: 'IMAP connection updated successfully',
      data,
    };
  }
}
