import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const req: Request = ctx.getRequest();
    const res: Response = ctx.getResponse();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      time: new Date().toString(),
    });
  }
}
