// swagger-tink-callback.ts
import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common'; 
import { TinkCallbackResponseDto, TinkErrorResponseDto } from './tink.dto';

export function TinkCallbackSwagger() {
  return applyDecorators(
    ApiQuery({
      name: 'code',
      required: true,
      description: 'Authorization code from Tink OAuth',
      example: 'abc123def456',
    }),
    ApiQuery({
      name: 'credentialsId',
      required: false,
      description: 'Credentials ID from Tink',
      example: 'cred_12345',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Transactions fetched successfully',
      type: TinkCallbackResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Missing authorization code',
      type: TinkErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Error during token exchange or transaction fetch',
      type: TinkErrorResponseDto,
    }),
  );
}
