import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { InvoiceAutoSyncDto } from './dto/invoiceAutoSyncDto';
import { InvoiceAutoSyncIntervalService } from './invoiceAutoSyncInterval.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('admin/subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoiceAutoSyncIntervalService: InvoiceAutoSyncIntervalService,
  ) {}

  @Public()
  @Get()
  subscriptionsDashboard() {
    return this.subscriptionsService.subscriptionsDashboardGraph();
  }

  @Post('plans')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get('plans')
  @Roles('ADMIN', 'USER', 'ACCOUNTANT')
  getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Get('plans/:id')
  @Roles('ADMIN', 'USER', 'ACCOUNTANT')
  getSubscriptionPlanById(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionPlan(id);
  }

  @Delete('plans/:id')
  @Roles('ADMIN')
  deleteSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionsService.deleteSubscription(id);
  }

  //  here are invoice auto-sync interval endpoints
  @Post('invoice-auto-sync-interval')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createInvoiceAutoSyncInterval(@Body() dto: InvoiceAutoSyncDto) {
    return this.invoiceAutoSyncIntervalService.createInvoiceAutoSyncInterval(
      dto,
    );
  }

  @Get('invoice-auto-sync-intervals')
  @Roles('ADMIN')
  getAllInvoiceAutoSyncIntervals() {
    return this.invoiceAutoSyncIntervalService.getAllInvoiceAutoSyncIntervals();
  }
}
