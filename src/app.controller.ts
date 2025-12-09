import { Controller, Get, Post } from '@nestjs/common';
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
  getAllInvoice() {
    const result = this.imapApisService.loadCronJobsFromDB();
    console.log(result);
    return result;
  }

  @Get('users')
  async getUsers() {
    return this.appService.getUsers();
  }

  @Post('createUser')
  async createUser() {
    return this.appService.createUser();
  }
}
