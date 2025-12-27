import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class ConnectBankDto {
  @ApiProperty({
    description: 'Market/Country code',
    example: 'SE',
    enum: ['AT', 'BE', 'DK', 'EE', 'FI', 'FR', 'DE', 'IE', 'IT', 'LV', 'LT', 'NL', 'NO', 'PL', 'PT', 'ES', 'SE', 'GB'],
    default: 'SE',
  })
  @IsOptional()
  @IsEnum(['AT', 'BE', 'DK', 'EE', 'FI', 'FR', 'DE', 'IE', 'IT', 'LV', 'LT', 'NL', 'NO', 'PL', 'PT', 'ES', 'SE', 'GB'])
  market?: string;

  @ApiProperty({
    description: 'Language/Locale code',
    example: 'en_US',
    enum: ['da_DK', 'de_DE', 'et_EE', 'en_US', 'es_ES', 'fi_FI', 'fr_FR', 'it_IT', 'lt_LT', 'lv_LV', 'nl_NL', 'no_NO', 'pt_PT', 'pl_PL', 'sv_SE'],
    default: 'en_US',
  })
  @IsOptional()
  @IsEnum(['da_DK', 'de_DE', 'et_EE', 'en_US', 'es_ES', 'fi_FI', 'fr_FR', 'it_IT', 'lt_LT', 'lv_LV', 'nl_NL', 'no_NO', 'pt_PT', 'pl_PL', 'sv_SE'])
  locale?: string;
}

export class ConnectBankResponseDto {
  @ApiProperty({
    description: 'Tink authorization URL to redirect user',
    example: 'https://link.tink.com/1.0/transactions/connect-accounts?client_id=xxx&redirect_uri=http://localhost:3001/tink/callback&market=SE&locale=en_US',
  })
  authorizationUrl: string;

  @ApiProperty({
    description: 'Instructions for user',
    example: 'Open this URL in browser to connect your bank',
  })
  message: string;

  @ApiProperty({
    description: 'Redirect URI where user will be sent after authorization',
    example: 'http://localhost:3001/tink/callback',
  })
  redirectUri: string;
}

export class TinkCallbackQueryDto {
  @ApiProperty({
    description: 'Authorization code received from Tink OAuth flow',
    example: 'abc123def456',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Credentials ID from Tink',
    example: 'cred_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  credentialsId?: string;
}

export class TinkCallbackResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Transactions fetched successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Credentials ID',
    example: 'cred_12345',
    required: false,
  })
  credentialsId?: string;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 25,
  })
  transactionCount: number;

  @ApiProperty({
    description: 'Array of formatted transactions',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        description: { type: 'string', example: 'Coffee Shop Purchase' },
        amount: { type: 'string', example: '12.50' },
        currency: { type: 'string', example: 'EUR' },
        date: { type: 'string', example: '2025-12-27' },
      },
    },
  })
  transactions: Array<{
    description: string;
    amount: string;
    currency: string;
    date: string;
  }>;
}

export class TinkErrorResponseDto {
  @ApiProperty({
    description: 'Error message',
    example: 'Tink callback error',
  })
  error: string;

  @ApiProperty({
    description: 'Detailed error message',
    example: 'Failed to fetch transactions: 401 - Unauthorized',
  })
  message: string;
}

export class ExchangeTokenDto {
  @ApiProperty({
    description: 'Authorization code to exchange for access token',
    example: 'abc123def456',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class GetTransactionsDto {
  @ApiProperty({
    description: 'Tink access token',
    example: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImJjMD...',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Access token',
    example: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImJjMD...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type?: string;

  @ApiProperty({
    description: 'Expires in seconds',
    example: 3600,
  })
  expires_in?: number;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction description',
    example: 'Coffee Shop Purchase',
  })
  description: string;

  @ApiProperty({
    description: 'Transaction amount',
    example: '12.50',
  })
  amount: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'EUR',
  })
  currency: string;

  @ApiProperty({
    description: 'Transaction date',
    example: '2025-12-27',
  })
  date: string;

  @ApiProperty({
    description: 'Raw transaction data',
    type: 'object',
    additionalProperties: true,
  })
  raw: any;
}
