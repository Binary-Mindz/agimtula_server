import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ProfileSettingsService } from './profile-settings.service';
import { Roles } from 'src/decorators/roles.decorator';
import { ProfileSettingsDto } from './dto/profile-setting.dto';
import { ApiParam } from '@nestjs/swagger';

@Controller('profile-settings')
export class ProfileSettingsController {
  constructor(
    private readonly profileSettingsService: ProfileSettingsService,
  ) { }

  // PATCH /profile-settings/:userId
  @Patch(':userId')
  @Roles('ADMIN')
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID',
    required: true,
  })
  async adminEditProfileSetting(
    @Param('userId') userId: string,
    @Body() dto: ProfileSettingsDto,
  ) {
    return await this.profileSettingsService.adminEditProfileSetting(
      dto,
      userId,
    );
  }
}
