import { Test, TestingModule } from '@nestjs/testing';
import { AccountantDashboardController } from './accountant-dashboard.controller';
import { AccountantDashboardService } from './accountant-dashboard.service';

describe('AccountantDashboardController', () => {
  let controller: AccountantDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountantDashboardController],
      providers: [AccountantDashboardService],
    }).compile();

    controller = module.get<AccountantDashboardController>(AccountantDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
