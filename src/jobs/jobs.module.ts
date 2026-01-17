import { Module } from '@nestjs/common';
import { SubscriptionExpiryCron } from './subscription-expiry.cron';
import { SmtpMailModule } from 'src/config/smtp-mail/smtp-mail.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { PaymentModule } from 'src/user-dashboard/payment/payment.module';
import { StripeService } from 'src/user-dashboard/payment/stripe.service';

@Module({
  imports: [SmtpMailModule, ActivityLogModule, PaymentModule],
  providers: [SubscriptionExpiryCron,StripeService],
})
export class JobsModule {}