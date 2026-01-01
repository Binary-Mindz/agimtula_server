import { Module } from '@nestjs/common';
import { RequesteAccountantService } from './request-accountant.service';
import { RequesteAccountantController } from './request-accountant.controller';

@Module({
  controllers: [RequesteAccountantController],
  providers: [RequesteAccountantService],
})
export class RequesteAccountantModule {}
