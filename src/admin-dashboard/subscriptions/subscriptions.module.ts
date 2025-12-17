import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { InvoiceAutoSyncIntervalService } from './invoiceAutoSyncInterval.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, InvoiceAutoSyncIntervalService],
})
export class SubscriptionsModule {}
