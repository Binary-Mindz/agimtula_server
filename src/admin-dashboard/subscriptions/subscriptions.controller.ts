import {
  Body,
  Controller,
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
  getPlans(@Body() dto: CreateSubscriptionPlanDto) {
    return { dto };
  }
}
