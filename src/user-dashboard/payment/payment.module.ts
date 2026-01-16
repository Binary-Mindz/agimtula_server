import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserPaymentController } from './payment.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from 'src/config/database/prisma.service';
import { SubscriptionExpiryCron } from 'src/jobs/subscription-expiry.cron';
import { WebhookController } from './webhook.controller';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';

@Module({
  imports: [ActivityLogModule],
  controllers: [UserPaymentController, WebhookController],
  providers: [
    PaymentService,
    StripeService,
    PrismaService,
    SubscriptionExpiryCron,
  ],
})
export class PaymentModule {}
