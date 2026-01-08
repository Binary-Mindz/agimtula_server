import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { BankDataService } from './bank-data.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('admin/bank-data')
export class BankDataController {
  constructor(private readonly bankDataService: BankDataService) { }

  @Get()
  @Public()
  getAllBanks() {
    return this.bankDataService.getAllBanks();
  }

  @Get(':id')
  @Public()
  getBankById(@Param('id') id: string) {
    return this.bankDataService.getBankById(id);
  }

  @Get(':id/transactions')
  @Public()
  getBankTransactions(@Param('id') id: string) {
    return this.bankDataService.getBankTransactions(id);
  }

  @Post('match-account')
  @Public()
  async matchAccountId(@Body() body: { accountId: string; accountNumber: string }) {
    return await this.bankDataService.matchAccountIdWithNumber(
      body.accountId,
      body.accountNumber,
    );
  }
}
