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
    return await this.bankService.getUserAccountsWithToken("eyJhbGciOiJFUzI1NiIsImtpZCI6ImJjMDhhOWVhLWE5NzItNGU2MS05N2I3LTZiNjJiNmRhZDQzOSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjY2OTUzODIsImlhdCI6MTc2NjY4ODE4MiwiaXNzIjoidGluazovL2F1dGgiLCJqdGkiOiJkZjNmZTIxMy1kYzUxLTQ1NmMtOWVlMy0xZmViZDMwNThjM2YiLCJvcmlnaW4iOiJtYWluIiwic2NvcGVzIjpbInVzZXI6cmVhZCIsImFjY291bnRzOnJlYWQiLCJjcmVkZW50aWFsczpyZWFkIiwidHJhbnNhY3Rpb25zOnJlYWQiXSwic3ViIjoidGluazovL2F1dGgvdXNlci9hZGZhMTkxNTkzNjk0NTY1YjIxZDUwZTA2MWQ1ZDc1OSIsInRpbms6Ly9hcHAvaWQiOiI5MWQ1MDAwNzVlZGU0NzA0YTg4ODcxYjZkNjAyMDIzNSIsInRpbms6Ly9hcHAvdmVyaWZpZWQiOiJmYWxzZSIsInRpbms6Ly9jbGllbnQvaWQiOiJiODRlZTEyYzM2NmE0ZWFmOTdiMWMzNzZkZDI1OTM0ZCJ9.JCnjIhM4KqEU6QrQXlDMzIoUrneOGfEcqb7m3Qd-F7SYOlAZNmyXdzfIQMpWB8uwLZpRvcwXXP0ykhNJTQ6n3Q");
  }
}