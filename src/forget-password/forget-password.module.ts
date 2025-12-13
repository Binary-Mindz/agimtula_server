import { Module } from '@nestjs/common';
import { ForgetPasswordService } from './forget-password.service';
import { ForgetPasswordController } from './forget-password.controller';

@Module({
  controllers: [ForgetPasswordController],
  providers: [ForgetPasswordService],
})
export class ForgetPasswordModule {}
