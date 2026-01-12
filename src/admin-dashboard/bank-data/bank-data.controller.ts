import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { BankDataService } from './bank-data.service';
import { Public } from 'src/decorators/public.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('admin/bank-data')
export class BankDataController {
  constructor(private readonly bankDataService: BankDataService) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all banks ( PUBLIC )' })
  getAllBanks() {
    return this.bankDataService.getAllBanks();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get bank by ID ( PUBLIC )' })
  getBankById(@Param('id') id: string) {
    return this.bankDataService.getBankById(id);
  }

  @Get(':id/transactions')
  @Public()
  @ApiOperation({ summary: 'Get bank transactions ( PUBLIC )' })
  getBankTransactions(@Param('id') id: string) {
    return this.bankDataService.getBankTransactions(id);
  }

  @Post('match-account')
  @Public()
  @ApiOperation({ summary: 'Match account ID ( PUBLIC )' })
  matchAccountId(@Body() body: { accountId: string; accountNumber: string }) {
    return this.bankDataService.matchAccountIdWithNumber(
      body.accountId,
      body.accountNumber,
    );
  }
}
