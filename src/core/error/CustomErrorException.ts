import { HttpException, HttpStatus } from '@nestjs/common';
export class CustomError extends HttpException {
  constructor(message: string, statusCode: number = HttpStatus.BAD_REQUEST) {
    super(
      {
        status: statusCode,
        message,
        timeStamps: new Date().toDateString(),
      },
      statusCode,
    );
  }
}
