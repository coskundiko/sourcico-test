import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { errorResponse } from '../types/response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as string | { message: string | string[] };
      message = typeof res === 'string' ? res : (Array.isArray(res.message) ? 'Validation failed' : res.message) || 'Error occurred';
      errors = Array.isArray((res as any).message) ? (res as any).message : null;
    } else {
      this.logger.error('Unhandled exception:', (exception as Error).stack ?? exception);
    }

    response.status(status).json(errorResponse(message, errors));
  }
}
