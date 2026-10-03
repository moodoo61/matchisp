import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * يسجّل كل استجابة فاشلة (4xx/5xx) في سجلات الخادم
 * لتسهيل تشخيص أخطاء الواجهة (مثل فشل حذف قناة).
 */
@Catch()
export class FailedRequestLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger('FailedRequest');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);
    const path = request.originalUrl || request.url;
    const line = `${request.method} ${path} → ${status} | ${message}`;

    if (status >= 500) {
      this.logger.error(
        line,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(line);
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            message: 'خطأ داخلي في الخادم',
          };

    response.status(status).json(
      typeof body === 'string'
        ? { statusCode: status, message: body }
        : body,
    );
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const raw = exception.getResponse();
      if (typeof raw === 'string') return raw;
      if (raw && typeof raw === 'object' && 'message' in raw) {
        const msg = (raw as { message?: string | string[] }).message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
      }
      return exception.message;
    }
    if (exception instanceof Error) return exception.message;
    return String(exception);
  }
}
