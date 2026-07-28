import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: Array<{ field: string; message: string }> = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const resp = exResponse as Record<string, unknown>;
        message = (resp['message'] as string) ?? message;
        if (Array.isArray(resp['message'])) {
          details = (resp['message'] as string[]).map((msg) => ({
            field: 'validation',
            message: msg,
          }));
          code = 'VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      if ('code' in exception && typeof exception.code === 'string') {
        switch (exception.code) {
          case 'P2002': {
            status = HttpStatus.CONFLICT;
            message = 'Unique constraint violation';
            code = 'UNIQUE_VIOLATION';
            break;
          }
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Record not found';
            code = 'NOT_FOUND';
            break;
          case 'P2003':
            status = HttpStatus.BAD_REQUEST;
            message = 'Foreign key constraint failed';
            code = 'FOREIGN_KEY_VIOLATION';
            break;
        }
      }
    }

    this.logger.error(
      `${request.method} ${request.url} ${status} ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      message,
      error: {
        code,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
