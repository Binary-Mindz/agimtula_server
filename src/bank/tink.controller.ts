/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { Controller, Get, Query, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TinkService } from './tink.service';
import { TransactionService } from 'src/user-dashboard/bank-transaction/transaction.service';
import { Public } from 'src/auth/decorators/public.decorator';
import {
  ConnectBankDto,
  ConnectBankResponseDto,
  TinkCallbackResponseDto,
  TinkErrorResponseDto,
  ExchangeTokenDto,
  GetTransactionsDto,
  TokenResponseDto,
  TransactionResponseDto,
} from './dto/tink.dto';

@ApiTags('Tink Bank Integration')
@Controller('tink')
export class TinkController {
  constructor(
    private tinkService: TinkService,
    private transactionService: TransactionService,
  ) { }

  @Post('connect-bank')
  @Public()
  @ApiOperation({
    summary: 'Generate bank connection URL',
    description:
      'Creates Tink authorization URL to initiate bank connection flow. Open the returned URL in browser to connect your bank.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: ConnectBankResponseDto,
  })
  connectBank(@Body() dto: ConnectBankDto): ConnectBankResponseDto {
    const market = dto.market || 'NL';
    const locale = dto.locale || 'en_US';

    const clientId =
      process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
    const redirectUri =
      process.env.TINK_REDIRECT_URI || 'http://localhost:3000/callback';

    const authorizationUrl = `https://link.tink.com/1.0/transactions/connect-accounts?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&market=${market}&locale=${locale}`;

    return {
      authorizationUrl,
      message: 'Open this URL in your browser to connect your bank account',
      redirectUri,
    };
  }

  @Get('callback')
  @Public()
  @ApiOperation({
    summary: 'OAuth callback handler',
    description:
      'Receives authorization code from Tink OAuth flow, exchanges it for access token, and fetches transactions',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code from Tink OAuth',
    example: 'abc123def456',
  })
  @ApiQuery({
    name: 'credentialsId',
    required: false,
    description: 'Credentials ID from Tink',
    example: 'cred_12345',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched successfully',
    type: TinkCallbackResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Missing authorization code',
    type: TinkErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error during token exchange or transaction fetch',
    type: TinkErrorResponseDto,
  })
  async callback(
    @Query('code') code: string,
    @Query('credentialsId') credentialsId: string,
  ): Promise<TinkCallbackResponseDto | TinkErrorResponseDto> {
    console.log(code);
    if (!code) {
      return {
        error: 'Missing authorization code',
        message: 'Code parameter is required',
      };
    }

    try {

      const tokenData = await this.tinkService.exchangeToken(code);
      const accessToken = tokenData.access_token;

      const transactions = await this.tinkService.getTransactions(accessToken);
      console.table(transactions)
      // Store in database
      await this.transactionService.storeTransactions(transactions);

      // 3️⃣ Log to server console
      console.log('===== TINK TRANSACTIONS =====');
      console.log('CredentialsId:', credentialsId);
      console.log('Access Token:', accessToken);
      console.log(`Found ${transactions.length} transactions\n`);

      transactions.forEach((trx, idx) => {
        console.log(`[${idx + 1}] ${trx.description}`);
        console.log(`${trx.amount} ${trx.currency} - ${trx.date}\n`);
      });

      console.log('==============================\n');

      // 4️⃣ Return success response with transaction data
      const formattedTransactions = transactions.map((trx) => ({
        description: trx.description,
        amount: trx.amount.toFixed(2),
        currency: trx.currency,
        date: trx.date,
      }));

      return {
        success: true,
        message: 'Transactions fetched successfully',
        credentialsId,
        transactionCount: transactions.length,
        transactions: formattedTransactions,
      };
    } catch (err: unknown) {
      console.error('Tink callback error:', err);
      return {
        error: 'Tink callback error',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Post('exchange-token')
  @Public()
  @ApiOperation({
    summary: 'Exchange authorization code for access token',
    description: 'Manually exchange Tink authorization code for access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token exchanged successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid code or exchange failed',
    type: TinkErrorResponseDto,
  })
  async exchangeToken(
    @Body() dto: ExchangeTokenDto,
  ): Promise<TokenResponseDto | TinkErrorResponseDto> {
    try {
      const tokenData = await this.tinkService.exchangeToken(dto.code);
      return tokenData;
    } catch (err: unknown) {
      return {
        error: 'Token exchange failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Post('get-transactions')
  @Public()
  @ApiOperation({
    summary: 'Fetch transactions using access token',
    description:
      'Retrieve user transactions from Tink using a valid access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or fetch failed',
    type: TinkErrorResponseDto,
  })
  async getTransactions(
    @Body() dto: GetTransactionsDto,
  ): Promise<TransactionResponseDto[] | TinkErrorResponseDto> {
    try {
      const transactions = await this.tinkService.getTransactions(
        dto.accessToken,
      );

      // Store in database
      await this.transactionService.storeTransactions(transactions);

      // Convert to expected format
      const formattedTransactions = transactions.map((trx) => ({
        description: trx.description,
        amount: trx.amount.toFixed(2),
        currency: trx.currency,
        date: trx.date,
        bankId: trx.accountId,
      }));

      return formattedTransactions;
    } catch (err: unknown) {
      return {
        error: 'Failed to fetch transactions',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Get('connected-accounts')
  @Public()
  @ApiOperation({
    summary: 'Fetch connected accounts',
    description: 'Retrieve user connected accounts from Tink',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connected accounts fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or fetch failed',
    type: TinkErrorResponseDto,
  })
  async getConnectedAccounts(
    @Query('accessToken') accessToken: string,
  ): Promise<any | TinkErrorResponseDto> {
    try {
      const accounts =
        await this.tinkService.fetchConnectedAccounts(accessToken);
      return accounts;
    } catch (err: unknown) {
      return {
        error: 'Failed to fetch connected accounts',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

}






