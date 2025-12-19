import { PartialType } from '@nestjs/swagger';
import { ImapEmailConnectionDto } from './imap-email-connection.dto';

export class UpdateConnectionDto extends PartialType(ImapEmailConnectionDto) {}
