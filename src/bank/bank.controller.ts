import { Controller, Get, Post, Query } from '@nestjs/common';
import { BankService } from './bank.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) { }

  @Post('getAppToken')
  @Public()
  async getAppToken() {
    return await this.bankService.getAppToken();
  }

  @Get('createUser')
  @Public()
  async createUser() {
    return await this.bankService.createUser();
  }

  @Get('consent-redirect')
  async handleConsentRedirect(@Query('code') code: string) {
    const userAccessToken = await this.bankService.getUserAccessToken(code);
    // const accounts = await this.bankService.getUserAccounts(userAccessToken);
    // const transactions = await this.bankService.getUserTransactions(userAccessToken);

    return {
      userAccessToken,
    };
  }


}
