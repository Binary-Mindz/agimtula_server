import { Controller } from '@nestjs/common';
import { ProfileSettingsService } from './profile-settings.service';

@Controller('profile-settings')
export class ProfileSettingsController {
  constructor(private readonly profileSettingsService: ProfileSettingsService) {}
}
