import { Module } from '@nestjs/common';
import { ProfileSettingsService } from './profile-settings.service';
import { ProfileSettingsController } from './profile-settings.controller';

@Module({
  controllers: [ProfileSettingsController],
  providers: [ProfileSettingsService],
})
export class ProfileSettingsModule {}
