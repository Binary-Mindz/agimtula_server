import { Module } from '@nestjs/common';
import { RequestAccountantService } from './request-accountant.service';
import { RequestAccountantController } from './request-accountant.controller';

@Module({
  controllers: [RequestAccountantController],
  providers: [RequestAccountantService],
})
export class RequestAccountantModule {}
