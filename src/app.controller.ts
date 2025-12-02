import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ImapApisService } from './imap-apis/imap-apis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly imapApisService: ImapApisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('getAllInvoice')
  async getAllInvoice(): Promise<any> {
    const result = await this.imapApisService.readAllAccounts();
    console.log(result.length);
    return result;
  }
}
