import { Test, TestingModule } from '@nestjs/testing';
import { ImapSystemMonitorService } from './imap-system-monitor.service';

describe('ImapSystemMonitorService', () => {
  let service: ImapSystemMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImapSystemMonitorService],
    }).compile();

    service = module.get<ImapSystemMonitorService>(ImapSystemMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
