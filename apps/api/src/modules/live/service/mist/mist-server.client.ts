import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MistApiResponse } from './mist-types';

/** عميل HTTP لـ MistServer api2 */
@Injectable()
export class MistServerClient {
  private readonly logger = new Logger(MistServerClient.name);

  constructor(private readonly config: ConfigService) {}

  apiUrl() {
    return (
      this.config.get<string>('MISTSERVER_API_URL')?.trim() ||
      'http://127.0.0.1:4242/api2'
    );
  }

  enabled() {
    const raw = this.config.get<string>('MISTSERVER_ENABLED');
    if (raw === undefined || raw === null || raw === '') return true;
    return !['0', 'false', 'no', 'off'].includes(raw.toLowerCase());
  }

  async request(body: Record<string, unknown>): Promise<MistApiResponse> {
    const url = this.apiUrl();
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      this.logger.error(`MistServer unreachable at ${url}`, err as Error);
      throw new ServiceUnavailableException(
        'خادم MistServer غير متاح — تعذر المزامنة',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `MistServer رفض الطلب (HTTP ${response.status})`,
      );
    }

    try {
      return (await response.json()) as MistApiResponse;
    } catch {
      throw new ServiceUnavailableException('استجابة MistServer غير صالحة');
    }
  }

  async ping(): Promise<{ ok: boolean; detail: string }> {
    if (!this.enabled()) {
      return { ok: false, detail: 'MistServer معطّل من الإعدادات' };
    }
    try {
      const data = await this.request({});
      const ok = data?.authorize?.status === 'OK' || data?.LTS === 1;
      return {
        ok: !!ok,
        detail: ok ? 'MistServer متصل' : 'استجابة غير متوقعة من MistServer',
      };
    } catch (err) {
      return {
        ok: false,
        detail: err instanceof Error ? err.message : 'MistServer غير متاح',
      };
    }
  }
}
