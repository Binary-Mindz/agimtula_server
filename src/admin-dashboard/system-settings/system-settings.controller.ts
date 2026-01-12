import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { TestDto } from './dto/test-dto';
import { Public } from 'src/decorators/public.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) { }

  @Post('create-email-template')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create email template ( ADMIN only )' })
  create(@Body() createEmailTemplateDto: CreateEmailTemplateDto) {
    return this.systemSettingsService.create(createEmailTemplateDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all email templates ( ADMIN only )' })
  findAll() {
    return this.systemSettingsService.findAll();
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update email template ( ADMIN only )' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmailTemplateDto>,
  ) {
    return this.systemSettingsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete email template ( ADMIN only )' })
  remove(@Param('id') id: string) {
    return this.systemSettingsService.remove(id);
  }

  @Post('test-email')
  @Public()
  @ApiOperation({ summary: 'Test email ( PUBLIC )' })
  async testEmail(@Body() dto: TestDto) {
    return await this.systemSettingsService.testApi(dto);
  }
}
