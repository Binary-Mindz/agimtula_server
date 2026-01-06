import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

export class ValidationException extends AppException {
  constructor(message: string = 'Invalid data provided') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundAppException extends AppException {
  constructor(message: string = 'Resource not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedAppException extends AppException {
  constructor(message: string = 'Unauthorized access') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenAppException extends AppException {
  constructor(message: string = 'Access forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictAppException extends AppException {
  constructor(message: string = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class DatabaseException extends AppException {
  constructor(message: string = 'Database operation failed') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class PaymentException extends AppException {
  constructor(message: string = 'Payment processing failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class SubscriptionException extends AppException {
  constructor(message: string = 'Subscription operation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}