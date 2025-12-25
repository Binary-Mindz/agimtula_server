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

  @Get('callback')
  @Public()
  async handleConsentRedirect(@Query() data: any) {
    // console.log("code", code);
    console.log("sharif", data);
    const userAccessToken = await this.bankService.getUserAccessToken(data?.code);
    console.log(userAccessToken);
    // const accounts = await this.bankService.getUserAccounts(userAccessToken);
    // const transactions = await this.bankService.getUserTransactions(userAccessToken);

    // return {
    //   userAccessToken,
    // };
    return { message: 'Consent received successfully' };
  }
  @Get('testToken')
  @Public()
  async getUserAccessToken(authCode: string) {
    return await this.bankService.getUserAccountsWithToken("eyJhbGciOiJFUzI1NiIsImtpZCI6IjUyZWFiNTZjLWZkZjctNDExZS04ZDAwLWM1OTljOWMxMTMzZCIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjY2Mjg2MDYsImlhdCI6MTc2NjYyMTQwNiwiaXNzIjoidGluazovL2F1dGgiLCJqdGkiOiJkZTEzYTJlMS0wYTA3LTRlMjktYjZkOC0yNGM2ZmU4NWJmNWUiLCJvcmlnaW4iOiJtYWluIiwic2NvcGVzIjpbInVzZXI6cmVhZCIsImFjY291bnRzOnJlYWQiLCJjcmVkZW50aWFsczpyZWFkIiwidHJhbnNhY3Rpb25zOnJlYWQiXSwic3ViIjoidGluazovL2F1dGgvdXNlci8yYWNiYTExYzY0Yjg0ZTJhYjJjYTljZTVhODM3NzZlNiIsInRpbms6Ly9hcHAvaWQiOiI5MWQ1MDAwNzVlZGU0NzA0YTg4ODcxYjZkNjAyMDIzNSIsInRpbms6Ly9hcHAvdmVyaWZpZWQiOiJmYWxzZSIsInRpbms6Ly9jbGllbnQvaWQiOiJiODRlZTEyYzM2NmE0ZWFmOTdiMWMzNzZkZDI1OTM0ZCJ9.mg_HeqhrjWTMj2POW7dy2IDijGUEHgsTn_G720vB3KBoz8cYdbKp3WqDzHH0kzY4WFPWywskz50ugPlMAxPCZQ");
  }
}