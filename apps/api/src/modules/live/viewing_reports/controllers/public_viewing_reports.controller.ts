import {
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../../../common/guards';
import { ViewingReportsService } from '../service/viewing-reports.service';

/**
 * استقبال مشغّل Mist USER_END (نص بأسطر).
 * @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_END
 */
@ApiExcludeController()
@Controller('public/live/viewing-reports')
export class PublicViewingReportsController {
  private readonly logger = new Logger(PublicViewingReportsController.name);

  constructor(private readonly reports: ViewingReportsService) {}

  @Public()
  @Post('user-end')
  @HttpCode(200)
  async userEnd(@Req() req: Request) {
    try {
      const raw = await readTriggerBody(req);
      const result = await this.reports.ingestUserEndPayload(raw);
      if (!result.ok) {
        this.logger.warn(
          `USER_END مرفوض: ${result.reason} — body=${JSON.stringify(raw.slice(0, 200))}`,
        );
      } else {
        this.logger.log(`USER_END محفوظ id=${result.id}`);
      }
    } catch (err) {
      this.logger.error(
        `فشل استقبال USER_END: ${err instanceof Error ? err.message : err}`,
      );
    }
    // الاستجابة تُتجاهل من Mist — نُرجع 200 دائماً
    return 'ok';
  }
}

function readTriggerBody(req: Request): Promise<string> {
  if (typeof req.body === 'string') return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body.toString('utf8'));
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
