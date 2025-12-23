import { PartialType } from '@nestjs/mapped-types';
import { CreateImapSystemMonitorDto } from './create-imap-system-monitor.dto';

export class UpdateImapSystemMonitorDto extends PartialType(CreateImapSystemMonitorDto) {}
