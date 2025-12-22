import { Test, TestingModule } from '@nestjs/testing';
import { ImapSystemMonitorController } from './imap-system-monitor.controller';
import { ImapSystemMonitorService } from './imap-system-monitor.service';

describe('ImapSystemMonitorController', () => {
  let controller: ImapSystemMonitorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImapSystemMonitorController],
      providers: [ImapSystemMonitorService],
    }).compile();

    controller = module.get<ImapSystemMonitorController>(ImapSystemMonitorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
