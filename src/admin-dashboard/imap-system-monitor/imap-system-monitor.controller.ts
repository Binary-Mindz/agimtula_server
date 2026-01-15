import { Controller } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';

@Controller('imap-system-monitor')
export class ImapSystemMonitorController {
  constructor(private readonly imapSystemMonitorService: ImapSystemMonitorService) {}
}
