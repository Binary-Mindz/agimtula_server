import { Test, TestingModule } from '@nestjs/testing';
import { AccountantDashboardService } from './accountant-dashboard.service';

describe('AccountantDashboardService', () => {
  let service: AccountantDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountantDashboardService],
    }).compile();

    service = module.get<AccountantDashboardService>(AccountantDashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
