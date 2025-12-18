import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PaymentMethodService } from './paymentMethod.service';
import { InvoiceLayoutService } from './invoice-layout.service';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    PaymentMethodService,
    InvoiceLayoutService,
    NotificationsService,
  ],
})
export class SettingsModule {}
