import { Controller, Get } from '@nestjs/common';
import { ImapApisService } from './imap-apis.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('imap-apis')
export class ImapApisController {
  constructor(private readonly imapService: ImapApisService) {}
  @Get('iii')
  @Public()
  async readEmailByAccountTest(): Promise<any> {
    return await this.imapService.readEmailByAccountTest(
      
    );
  }
}
