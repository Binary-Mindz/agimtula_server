import { Injectable } from '@nestjs/common';
import { CreateImapSystemMonitorDto } from './dto/create-imap-system-monitor.dto';
import { UpdateImapSystemMonitorDto } from './dto/update-imap-system-monitor.dto';

@Injectable()
export class ImapSystemMonitorService {
  create(createImapSystemMonitorDto: CreateImapSystemMonitorDto) {
    return createImapSystemMonitorDto;
  }

  findAll() {
    return `This action returns all imapSystemMonitor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} imapSystemMonitor`;
  }

  update(id: number, updateImapSystemMonitorDto: UpdateImapSystemMonitorDto) {
    return updateImapSystemMonitorDto;
  }

  remove(id: number) {
    return `This action removes a #${id} imapSystemMonitor`;
  }
}
