import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    console.error(exception);

    // to make it compatible with stellar standards which expect property .error
    response
      .status(status)
      .json({
        ...(typeof exceptionResponse === 'string' ? { error: exceptionResponse } : exceptionResponse),
        error: exception.message,
      });
  }
}
