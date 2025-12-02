import { Test, TestingModule } from '@nestjs/testing';
import { ImapApisService } from './imap-apis.service';

describe('ImapApisService', () => {
  let service: ImapApisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImapApisService],
    }).compile();

    service = module.get<ImapApisService>(ImapApisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
