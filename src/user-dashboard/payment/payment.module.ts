import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserPaymentController } from './payment.controller';
import { StripeService } from './stripe.service';
import { PrismaService } from 'src/config/database/prisma.service';
// import { WebhookController } from 'src/webhook/webhook.controller';

@Module({
  controllers: [UserPaymentController],
  providers: [PaymentService, StripeService, PrismaService],
})
export class PaymentModule {}
