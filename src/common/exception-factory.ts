import { HttpStatus } from '@nestjs/common';
import { 
  AppException,
  ValidationException,
  NotFoundAppException,
  UnauthorizedAppException,
  ForbiddenAppException,
  ConflictAppException,
  DatabaseException,
  PaymentException,
  SubscriptionException,
  BusinessLogicException,
  ExternalServiceException,
  RateLimitException
} from './app-exceptions';
import { ERROR_CODES, ERROR_MESSAGES, ErrorCode } from './error-constants';

export class ExceptionFactory {
  /**
   * Create a validation exception with proper error code
   */
  static validation(message?: string, details?: any): ValidationException {
    return new ValidationException(
      message || ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR],
      details
    );
  }

  /**
   * Create a not found exception with proper error code
   */
  static notFound(resource: string = 'Resource', details?: any): NotFoundAppException {
    return new NotFoundAppException(
      `${resource} not found`,
      details
    );
  }

  /**
   * Create an unauthorized exception with proper error code
   */
  static unauthorized(message?: string, details?: any): UnauthorizedAppException {
    return new UnauthorizedAppException(
      message || ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
      details
    );
  }

  /**
   * Create a forbidden exception with proper error code
   */
  static forbidden(message?: string, details?: any): ForbiddenAppException {
    return new ForbiddenAppException(
      message || ERROR_MESSAGES[ERROR_CODES.FORBIDDEN],
      details
    );
  }

  /**
   * Create a conflict exception with proper error code
   */
  static conflict(resource: string = 'Resource', details?: any): ConflictAppException {
    return new ConflictAppException(
      `${resource} already exists`,
      details
    );
  }

  /**
   * Create a database exception with proper error code
   */
  static database(message?: string, details?: any): DatabaseException {
    return new DatabaseException(
      message || ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR],
      details
    );
  }

  /**
   * Create a payment exception with proper error code
   */
  static payment(message?: string, details?: any): PaymentException {
    return new PaymentException(
      message || ERROR_MESSAGES[ERROR_CODES.PAYMENT_ERROR],
      details
    );
  }

  /**
   * Create a subscription exception with proper error code
   */
  static subscription(message?: string, details?: any): SubscriptionException {
    return new SubscriptionException(
      message || ERROR_MESSAGES[ERROR_CODES.SUBSCRIPTION_ERROR],
      details
    );
  }

  /**
   * Create a business logic exception with proper error code
   */
  static businessLogic(message: string, details?: any): BusinessLogicException {
    return new BusinessLogicException(message, details);
  }

  /**
   * Create an external service exception with proper error code
   */
  static externalService(service: string, details?: any): ExternalServiceException {
    return new ExternalServiceException(
      `${service} service error`,
      details
    );
  }

  /**
   * Create a rate limit exception with proper error code
   */
  static rateLimit(message?: string, details?: any): RateLimitException {
    return new RateLimitException(
      message || ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_ERROR],
      details
    );
  }

  /**
   * Create a custom exception with specific error code
   */
  static custom(
    errorCode: ErrorCode,
    message?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any
  ): AppException {
    return new AppException(
      message || ERROR_MESSAGES[errorCode],
      statusCode,
      errorCode,
      details
    );
  }

  /**
   * Create an exception for expired subscription
   */
  static subscriptionExpired(details?: any): SubscriptionException {
    return new SubscriptionException(
      ERROR_MESSAGES[ERROR_CODES.SUBSCRIPTION_EXPIRED],
      details
    );
  }

  /**
   * Create an exception for invalid credentials
   */
  static invalidCredentials(details?: any): UnauthorizedAppException {
    return new UnauthorizedAppException(
      ERROR_MESSAGES[ERROR_CODES.INVALID_CREDENTIALS],
      details
    );
  }

  /**
   * Create an exception for quota exceeded
   */
  static quotaExceeded(resource: string, details?: any): BusinessLogicException {
    return new BusinessLogicException(
      `${resource} quota exceeded`,
      details
    );
  }

  /**
   * Create an exception for file operations
   */
  static fileError(operation: string, details?: any): AppException {
    return new AppException(
      `File ${operation} failed`,
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.UPLOAD_FAILED,
      details
    );
  }

  /**
   * Create an exception for IMAP operations
   */
  static imapError(message?: string, details?: any): ExternalServiceException {
    return new ExternalServiceException(
      message || ERROR_MESSAGES[ERROR_CODES.IMAP_CONNECTION_FAILED],
      details
    );
  }
}