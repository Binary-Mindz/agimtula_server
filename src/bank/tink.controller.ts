import { Controller, Get, Query, Post, Body, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TinkService } from './tink.service';
import { Public } from 'src/decorators/public.decorator';
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
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/decorators/roles.decorator';


@ApiTags('Tink Bank Integration')
@Controller('tink')
export class TinkController {
  constructor(
    private tinkService: TinkService,
  ) { }

  @Post('connect-bank')
  @Public()
  @ApiOperation({ summary: 'Generate bank connection URL ( PUBLIC )' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: ConnectBankResponseDto,
  })
  connectBank(@Body() dto: ConnectBankDto, @User() user: jwtPayload,): ConnectBankResponseDto {
    const market = dto.market || 'NL';
    const locale = dto.locale || 'en_US';

    const clientId =
      process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
    const redirectUri =
      process.env.TINK_REDIRECT_URI || 'http://localhost:3000/callback';

    const authorizationUrl = `https://link.tink.com/1.0/transactions/connect-accounts?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&market=${market}&locale=${locale}`;
    console.log({ user });
    return {
      authorizationUrl,
      message: 'Open this URL in your browser to connect your bank account',
      redirectUri,
    };
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'OAuth callback handler ( PUBLIC )' })
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
  ) {
    if (!code) {
      return {
        error: 'Missing authorization code',
        message: 'Code parameter is required',
      };
    }

    try {

      const tokenData = await this.tinkService.exchangeToken(code);
      const accessToken = tokenData.access_token;
      return accessToken;

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
  @ApiOperation({ summary: 'Exchange authorization code ( PUBLIC )' })
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

  @Post('stored-my-transactions')
  @UseGuards(AuthGuard)
  @Roles('USER')
  @ApiOperation({ summary: 'Fetch transactions ( USER only )' })
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
    @User() user: jwtPayload,
  ) {
    try {
      const transactions = await this.tinkService.getTransactions(
        dto.accessToken,
      );

      const savedData = await this.tinkService.storeMyTransaction(user.sub, transactions, dto.accessToken);
      return savedData;
    } catch (err: unknown) {
      return {
        error: 'Failed to fetch transactions',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Get('connected-accounts')
  @Public()
  @ApiOperation({ summary: 'Fetch connected accounts ( PUBLIC )' })
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






