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

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('plans')
  @Roles('ADMIN')
  @UsePipes(new ValidationPipe({ transform: true }))
  createSubscriptionPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createSubscription(dto);
  }

  @Get('plans')
  @Roles('ADMIN')
  getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @Delete('plans/:id')
  @Roles('ADMIN', 'USER', 'ACCOUNTANT')
  deleteSubscriptionPlan(@Param('id') id: string) {
    return this.subscriptionsService.deleteSubscription(id);
  }
}
