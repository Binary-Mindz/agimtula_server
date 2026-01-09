/* eslint-disable @typescript-eslint/no-unsafe-return */
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, ERROR_MESSAGES } from './error-constants';

export interface ErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  timestamp: string;
  path?: string;
  details?: any;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data?: any;
}

export class ErrorResponseUtil {
  static createErrorResponse(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    errorCode?: string,
    path?: string,
    details?: any
  ): ErrorResponse {
    return {
      success: false,
      message,
      statusCode,
      ...(errorCode && { errorCode }),
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      ...(details && { details }),
    };
  }

  static createSuccessResponse(
    message: string,
    data?: any,
    statusCode: number = HttpStatus.OK
  ): SuccessResponse {
    return {
      success: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(data && { data }),
    };
  }

  // Quick error response creators
  static validationError(message?: string, details?: any): ErrorResponse {
    return this.createErrorResponse(
      message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      undefined,
      details
    );
  }

  static notFoundError(resource: string = 'Resource', details?: any): ErrorResponse {
    return this.createErrorResponse(
      `${resource} not found`,
      HttpStatus.NOT_FOUND,
      ERROR_CODES.NOT_FOUND,
      undefined,
      details
    );
  }

  static unauthorizedError(message?: string, details?: any): ErrorResponse {
    return this.createErrorResponse(
      message || ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
      HttpStatus.UNAUTHORIZED,
      ERROR_CODES.UNAUTHORIZED,
      undefined,
      details
    );
  }

  static forbiddenError(message?: string, details?: any): ErrorResponse {
    return this.createErrorResponse(
      message || ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
      HttpStatus.FORBIDDEN,
      ERROR_CODES.FORBIDDEN,
      undefined,
      details
    );
  }

  static conflictError(resource: string = 'Resource', details?: any): ErrorResponse {
    return this.createErrorResponse(
      `${resource} already exists`,
      HttpStatus.CONFLICT,
      ERROR_CODES.CONFLICT,
      undefined,
      details
    );
  }

  static internalError(message?: string, details?: any): ErrorResponse {
    return this.createErrorResponse(
      message || ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
      HttpStatus.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      undefined,
      details
    );
  }

  // Common success responses
  static operationSuccess(message: string = 'Operation completed successfully', data?: any): SuccessResponse {
    return this.createSuccessResponse(message, data);
  }

  static dataRetrieved(data: any, message: string = 'Data retrieved successfully'): SuccessResponse {
    return this.createSuccessResponse(message, data);
  }

  static resourceCreated(data: any, resource: string = 'Resource'): SuccessResponse {
    return this.createSuccessResponse(`${resource} created successfully`, data, HttpStatus.CREATED);
  }

  static resourceUpdated(data: any, resource: string = 'Resource'): SuccessResponse {
    return this.createSuccessResponse(`${resource} updated successfully`, data);
  }

  static resourceDeleted(resource: string = 'Resource'): SuccessResponse {
    return this.createSuccessResponse(`${resource} deleted successfully`);
  }
}