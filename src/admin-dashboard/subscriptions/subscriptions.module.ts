import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { AdminSubscriptionsController } from './subscriptions.controller';
import { InvoiceAutoSyncIntervalService } from './invoiceAutoSyncInterval.service';

@Module({
  controllers: [AdminSubscriptionsController],
  providers: [SubscriptionsService, InvoiceAutoSyncIntervalService],
})
export class SubscriptionsModule {}
