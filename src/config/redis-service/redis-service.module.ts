import { Global, Module } from '@nestjs/common';
import { RedisServiceService } from './redis-service.service';

@Global()
@Module({
  providers: [RedisServiceService],
  exports: [RedisServiceService],
})
export class RedisServiceModule {}
