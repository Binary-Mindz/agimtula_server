import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../../common/app-exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req: Request = ctx.getRequest();
    const res: Response = ctx.getResponse();

    let status: number;
    let message: string;
    let errorCode: string | undefined;
    let details: any;

    if (exception instanceof AppException) {
      // Handle custom app exceptions
      status = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'string'
          ? response
          : (response as any).message || 'An error occurred';
    } else {
      // Handle unexpected errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorCode = 'INTERNAL_ERROR';

      // Log the actual error for debugging
      this.logger.error('Unexpected error occurred', exception);
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      ...(errorCode && { errorCode }),
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      path: req.url,
    };

    // Log error for monitoring (except for client errors)
    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url}`, exception);
    } else if (status >= 400) {
      this.logger.warn(`${req.method} ${req.url} - ${message}`);
    }

    res.status(status).json(errorResponse);
  }
}
