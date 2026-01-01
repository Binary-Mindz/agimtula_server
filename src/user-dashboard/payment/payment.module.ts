import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserPaymentController } from './payment.controller';

@Module({
  controllers: [UserPaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
