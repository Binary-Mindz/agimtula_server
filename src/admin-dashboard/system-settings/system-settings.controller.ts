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
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TestDto } from './dto/test-dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Post('create-email-template')
  @Roles('ADMIN')
  create(@Body() createEmailTemplateDto: CreateEmailTemplateDto) {
    return this.systemSettingsService.create(createEmailTemplateDto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.systemSettingsService.findAll();
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateEmailTemplateDto>,
  ) {
    return this.systemSettingsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.systemSettingsService.remove(id);
  }

  @Post('test-email')
  @Public()
  async testEmail(@Body() dto: TestDto) {
    return await this.systemSettingsService.testApi(dto);
  }
}
