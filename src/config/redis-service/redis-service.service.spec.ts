import { Test, TestingModule } from '@nestjs/testing';
import { RedisServiceService } from './redis-service.service';

describe('RedisServiceService', () => {
  let service: RedisServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisServiceService],
    }).compile();

    service = module.get<RedisServiceService>(RedisServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
