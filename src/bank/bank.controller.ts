import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { BankStatementService } from './bank-statement.service';
import { TinkService } from './tink.service';
import { UploadBankStatementDto } from './dto/upload-bank-statement.dto';
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
import { Roles } from 'src/decorators/roles.decorator';
import { UserRole } from 'prisma/generated/prisma/enums';
import { Public } from 'src/decorators/public.decorator';
import { User } from 'src/decorators/user.decorator';
import { jwtPayload } from 'src/auth/types/jwt-payload';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { ActivityLogService } from 'src/common/activity-log/activity-log.service';

@ApiTags('Bank Management')
@Controller('bank')
export class BankController {
  private readonly logger = new Logger(BankController.name);

  constructor(
    private readonly bankStatementService: BankStatementService,
    private readonly tinkService: TinkService,
    private readonly activityLog: ActivityLogService,
  ) {
    this.logger.log('BankController initialized');
  }

  // ==================== BANK STATEMENT UPLOAD ====================

  @Post('statement/upload')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Upload bank statement file ( USER )' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Bank statement file',
    type: UploadBankStatementDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadBankStatement(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Received file: ${file.originalname} (${file.mimetype})`);

    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (!fileExtension || !['940', 'xml'].includes(fileExtension)) {
      throw new BadRequestException(
        'Invalid file format. Only .940 (MT940) and .xml (CAMT.053) files are supported.',
      );
    }

    try {
      const result = await this.bankStatementService.processFile(
        file,
        fileExtension,
      );

      // Log successful bank import
      await this.activityLog.log({
        type: 'BANK_IMPORT_COMPLETED',
        title: `Bank import completed: ${result.transactions?.length || 0} transactions`,
        category: 'SYSTEM',
        level: 'INFO',
      });

      return {
        success: true,
        message: 'File processed successfully',
        fileType: fileExtension === '940' ? 'MT940' : 'CAMT.053',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error processing file: ${error.message}`);

      // Log bank import error
      await this.activityLog.log({
        type: 'BANK_IMPORT_FAILED',
        title: 'Bank import failed',
        description: error.message,
        category: 'SYSTEM',
        level: 'ERROR',
      });

      throw new BadRequestException(`Failed to process file: ${error.message}`);
    }
  }

  // ==================== TINK BANK INTEGRATION ====================

  @Post('tink/connect')
  @Public()
  @ApiOperation({ summary: 'Generate Tink bank connection URL ( PUBLIC )' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    type: ConnectBankResponseDto,
  })
  connectBank(
    @Body() dto: ConnectBankDto,
    @User() user: jwtPayload,
  ): ConnectBankResponseDto {
    const market = dto.market || 'NL';
    const locale = dto.locale || 'en_US';

    const clientId =
      process.env.TINK_CLIENT_ID || 'b84ee12c366a4eaf97b1c376dd25934d';
    const redirectUri =
      process.env.TINK_REDIRECT_URI || 'http://localhost:3000/callback';

    const authorizationUrl = `https://link.tink.com/1.0/transactions/connect-accounts?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&market=${market}&locale=${locale}`;
    
    this.logger.log(`Generating Tink connection URL for user: ${user?.sub || 'anonymous'}`);

    return {
      authorizationUrl,
      message: 'Open this URL in your browser to connect your bank account',
      redirectUri,
    };
  }

  @Get('tink/callback')
  @Public()
  @ApiOperation({ summary: 'Tink OAuth callback handler ( PUBLIC )' })
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
  async tinkCallback(@Query('code') code: string) {
    if (!code) {
      return {
        error: 'Missing authorization code',
        message: 'Code parameter is required',
      };
    }

    try {
      const tokenData = await this.tinkService.exchangeToken(code);
      const accessToken = tokenData.access_token;
      this.logger.log('Tink callback processed successfully');
      return accessToken;
    } catch (err: unknown) {
      this.logger.error('Tink callback error:', err);
      return {
        error: 'Tink callback error',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Post('tink/exchange-token')
  @Public()
  @ApiOperation({ summary: 'Exchange authorization code for access token ( PUBLIC )' })
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
      this.logger.log('Token exchange successful');
      return tokenData;
    } catch (err: unknown) {
      this.logger.error('Token exchange failed:', err);
      return {
        error: 'Token exchange failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Post('tink/transactions/store')
  @UseGuards(AuthGuard)
  @Roles('USER')
  @ApiOperation({ summary: 'Fetch and store Tink transactions ( USER only )' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched and stored successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid token or fetch failed',
    type: TinkErrorResponseDto,
  })
  async storeTransactions(
    @Body() dto: GetTransactionsDto,
    @User() user: jwtPayload,
  ) {
    try {
      const transactions = await this.tinkService.getTransactions(
        dto.accessToken,
      );

      const savedData = await this.tinkService.storeMyTransaction(
        user.sub,
        transactions,
        dto.accessToken,
      );
      
      // this.logger.log(`Stored ${savedData?.length || 0} transactions for user: ${user.sub}`);
      return savedData;
    } catch (err: unknown) {
      this.logger.error('Failed to store transactions:', err);
      return {
        error: 'Failed to fetch transactions',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  @Get('tink/accounts/connected')
  @Public()
  @ApiOperation({ summary: 'Fetch connected Tink accounts ( PUBLIC )' })
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
  ): Promise<TinkErrorResponseDto | unknown> {
    try {
      const accounts =
        await this.tinkService.fetchConnectedAccounts(accessToken);
      // this.logger.log(`Fetched ${accounts?.length || 0} connected accounts`);
      return accounts;
    } catch (err: unknown) {
      this.logger.error('Failed to fetch connected accounts:', err);
      return {
        error: 'Failed to fetch connected accounts',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
