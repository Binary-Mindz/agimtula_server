import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { CreateImapSystemMonitorDto } from './dto/create-imap-system-monitor.dto';
import { UpdateImapSystemMonitorDto } from './dto/update-imap-system-monitor.dto';
import { urlPrefix } from '../url-prefix';

@Controller(`${urlPrefix}/imap-system-monitor`)
export class AdminImapSystemMonitorController {
  constructor(private readonly imapSystemMonitorService: ImapSystemMonitorService) {}

  @Post()
  create(@Body() createImapSystemMonitorDto: CreateImapSystemMonitorDto) {
    return this.imapSystemMonitorService.create(createImapSystemMonitorDto);
  }

  @Get()
  findAll() {
    return this.imapSystemMonitorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.imapSystemMonitorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImapSystemMonitorDto: UpdateImapSystemMonitorDto) {
    return this.imapSystemMonitorService.update(+id, updateImapSystemMonitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imapSystemMonitorService.remove(+id);
  }
}
