import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { Response } from 'express';
import { Prisma } from 'prisma/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2000':
        message = 'Input value is too long';
        break;

      case 'P2001':
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;

      case 'P2002':
        message = `Duplicate value for unique field: ${String(exception.meta?.target)}`;
        statusCode = HttpStatus.CONFLICT;
        break;

      case 'P2003':
        message = 'Foreign key constraint failed';
        break;

      case 'P2025':
        message = 'Record to update not found';
        statusCode = HttpStatus.NOT_FOUND;
        break;

      default:
        message = exception.message;
        break;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: 'Prisma Error',
    });
  }
}
