import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription.dto';
import { Roles } from 'src/decorators/roles.decorator';
import { CreateInvoiceAutoSyncDto } from './dto/create-invoice-auto-sync.dto';
import { InvoiceAutoSyncIntervalService } from './invoiceAutoSyncInterval.service';
import { urlPrefix } from '../url-prefix';
import { ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller(`${urlPrefix}/subscriptions`)
export class AdminSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly invoiceAutoSyncIntervalService: InvoiceAutoSyncIntervalService,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get subscriptions dashboard ( ADMIN only )' })
  subscriptionsDashboard() {
    return this.subscriptionsService.subscriptionsDashboardGraph();
  }

  @Post('plans')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create subscription plan ( ADMIN only )' })
  createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'Get subscription plans ( ADMIN, USER )' })
  getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Get('plans/:id')
  @Roles('ADMIN', 'USER')
  @ApiOperation({ summary: 'Get subscription plan by ID ( ADMIN, USER )' })
  getSubscriptionPlanById(@Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionPlan(id);
  }

  @Delete('plans/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete subscription plan ( ADMIN only )' })
  deleteSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionsService.deleteSubscription(id);
  }

  @Patch('update/:id')
  @Roles("ADMIN")
    @ApiOperation({ summary: 'Update subscription plan ( ADMIN only )' })
  updateSubscriptionPlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(id, dto);
  }

  //  here are invoice auto-sync interval endpoints
  @Get('invoice-auto-sync-intervals/available')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get available sync intervals ( ADMIN only )' })
  getAvailableSyncIntervals() {
    return this.invoiceAutoSyncIntervalService.getAvailableIntervals();
  }

  @Post('invoice-auto-sync-interval')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create invoice auto sync interval ( ADMIN only )' })
  createInvoiceAutoSyncInterval(@Body() dto: CreateInvoiceAutoSyncDto) {
    return this.invoiceAutoSyncIntervalService.createInvoiceAutoSyncInterval(
      dto,
    );
  }

  @Get('invoice-auto-sync-intervals')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Get all invoice auto sync intervals ( ADMIN only )',
  })
  getAllInvoiceAutoSyncIntervals() {
    return this.invoiceAutoSyncIntervalService.getAllInvoiceAutoSyncIntervals();
  }
}
