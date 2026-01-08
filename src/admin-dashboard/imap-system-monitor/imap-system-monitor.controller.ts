import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ImapSystemMonitorService } from './imap-system-monitor.service';
import { CreateImapSystemMonitorDto } from './dto/create-imap-system-monitor.dto';
import { UpdateImapSystemMonitorDto } from './dto/update-imap-system-monitor.dto';
import { urlPrefix } from '../url-prefix';
import { ApiOperation } from '@nestjs/swagger';

@Controller(`${urlPrefix}/imap-system-monitor`)
export class AdminImapSystemMonitorController {
  constructor(private readonly imapSystemMonitorService: ImapSystemMonitorService) {}

  @Post()
  @ApiOperation({ summary: 'Create IMAP system monitor' })
  create(@Body() createImapSystemMonitorDto: CreateImapSystemMonitorDto) {
    return this.imapSystemMonitorService.create(createImapSystemMonitorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all IMAP system monitors' })
  findAll() {
    return this.imapSystemMonitorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single IMAP system monitor' })
  findOne(@Param('id') id: string) {
    return this.imapSystemMonitorService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update IMAP system monitor' })
  update(@Param('id') id: string, @Body() updateImapSystemMonitorDto: UpdateImapSystemMonitorDto) {
    return this.imapSystemMonitorService.update(+id, updateImapSystemMonitorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete IMAP system monitor' })
  remove(@Param('id') id: string) {
    return this.imapSystemMonitorService.remove(+id);
  }
}
