import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuditService } from '../modules/audit/audit.service';
import type { RequestUser } from './guards';

type AuthedRequest = Request & { user?: RequestUser };

/**
 * يسجّل الاستجابات الفاشلة في journal + سجلات التدقيق (للعمليات).
 */
@Injectable()
@Catch()
export class FailedRequestLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger('FailedRequest');

  constructor(private readonly audit: AuditService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthedRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);
    const path = request.originalUrl || request.url;
    const method = (request.method || 'GET').toUpperCase();
    const line = `${method} ${path} → ${status} | ${message}`;

    if (status >= 500) {
      this.logger.error(
        line,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(line);
    }

    void this.writeAudit(request, method, path, status, message);

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

  private async writeAudit(
    request: AuthedRequest,
    method: string,
    path: string,
    status: number,
    message: string,
  ) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    // تجنّب إغراق التدقيق بـ 401 على كل صفحة؛ نركّز على فشل العمليات و5xx
    if (status === 401 || status === 403) return;
    if (!isMutation && status < 500) return;

    try {
      await this.audit.log({
        actorId: request.user?.id ?? null,
        action: 'failed',
        resource: this.resourceFromPath(path),
        resourceId: this.resourceIdFromPath(path),
        metadata: {
          method,
          path,
          status,
          message,
        },
        ipAddress: request.ip,
        userAgent: request.get('user-agent') ?? undefined,
      });
    } catch (err) {
      this.logger.warn(
        `تعذر كتابة فشل الطلب في التدقيق: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private resourceFromPath(path: string): string {
    const clean = path.split('?')[0] ?? path;
    const parts = clean.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    if (parts.length === 0) return 'http';
    // live/channels/:id → live.channels
    const resourceParts = parts.filter((p) => !this.looksLikeId(p));
    return resourceParts.slice(0, 3).join('.') || 'http';
  }

  private resourceIdFromPath(path: string): string | null {
    const clean = path.split('?')[0] ?? path;
    const parts = clean.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i];
      if (part && this.looksLikeId(part)) return part;
    }
    return null;
  }

  private looksLikeId(value: string): boolean {
    return (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ) || /^\d+$/.test(value)
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
