import { Test, TestingModule } from '@nestjs/testing';
import { ImapApisController } from './imap-apis.controller';
import { ImapApisService } from './imap-apis.service';

describe('ImapApisController', () => {
  let controller: ImapApisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImapApisController],
      providers: [ImapApisService],
    }).compile();

    controller = module.get<ImapApisController>(ImapApisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
