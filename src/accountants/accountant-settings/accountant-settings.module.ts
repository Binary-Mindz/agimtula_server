import { Module } from '@nestjs/common';
import { AccountantSettingsService } from './accountant-settings.service';
import { AccountantSettingsController } from './accountant-settings.controller';
import { ManageClients } from './manage-clients.service';

@Module({
  controllers: [AccountantSettingsController],
  providers: [AccountantSettingsService, ManageClients],
})
export class AccountantSettingsModule {}
