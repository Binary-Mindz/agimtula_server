import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from 'prisma/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Database operation failed';

    // Log the error for debugging (without sensitive data)
    this.logger.error(
      `Prisma error ${exception.code} on ${request.url}`,
      {
        code: exception.code,
        path: request.url,
        method: request.method,
      },
    );

    switch (exception.code) {
      case 'P2000':
        message = 'Input value is too long';
        break;

      case 'P2001':
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;

      case 'P2002':
        message = 'Duplicate entry';
        statusCode = HttpStatus.CONFLICT;
        break;

      case 'P2003':
        message = 'Invalid reference';
        break;

      case 'P2025':
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;

      case 'P2014':
        message = 'Invalid relation';
        break;

      default:
        message = 'Database operation failed';
        break;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
