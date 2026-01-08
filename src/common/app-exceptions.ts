import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorCode?: string,
    public readonly details?: any,
  ) {
    super(message, statusCode);
    this.name = this.constructor.name;
  }
}

export class ValidationException extends AppException {
  constructor(message: string = 'Invalid data provided', details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundAppException extends AppException {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, HttpStatus.NOT_FOUND, 'NOT_FOUND', details);
  }
}

export class UnauthorizedAppException extends AppException {
  constructor(message: string = 'Unauthorized access', details?: any) {
    super(message, HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenAppException extends AppException {
  constructor(message: string = 'Access forbidden', details?: any) {
    super(message, HttpStatus.FORBIDDEN, 'FORBIDDEN', details);
  }
}

export class ConflictAppException extends AppException {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT', details);
  }
}

export class DatabaseException extends AppException {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR', details);
  }
}

export class PaymentException extends AppException {
  constructor(message: string = 'Payment processing failed', details?: any) {
    super(message, HttpStatus.BAD_REQUEST, 'PAYMENT_ERROR', details);
  }
}

export class SubscriptionException extends AppException {
  constructor(
    message: string = 'Subscription operation failed',
    details?: any,
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'SUBSCRIPTION_ERROR', details);
  }
}

// Additional useful exceptions
export class BusinessLogicException extends AppException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'BUSINESS_LOGIC_ERROR',
      details,
    );
  }
}

export class ExternalServiceException extends AppException {
  constructor(message: string = 'External service error', details?: any) {
    super(message, HttpStatus.BAD_GATEWAY, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export class RateLimitException extends AppException {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_ERROR', details);
  }
}
