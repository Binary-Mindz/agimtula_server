import { Module } from '@nestjs/common';
import { CustomUserService } from './custom-user.service';
import { CustomUserController } from './custom-user.controller';

@Module({
  controllers: [CustomUserController],
  providers: [CustomUserService],
})
export class CustomUserModule {}
