import { Test, TestingModule } from '@nestjs/testing';
import { SmtpMailService } from './smtp-mail.service';

describe('SmtpMailService', () => {
  let service: SmtpMailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmtpMailService],
    }).compile();

    service = module.get<SmtpMailService>(SmtpMailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
