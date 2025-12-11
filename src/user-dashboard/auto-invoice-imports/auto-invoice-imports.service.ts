import { Injectable } from '@nestjs/common';
import { ImapEmailConnectionDto } from './dto/imap-email-connection.dto';

@Injectable()
export class AutoInvoiceImportsService {
  updateImapConnection(data: ImapEmailConnectionDto) {
    return data;
  }
}
