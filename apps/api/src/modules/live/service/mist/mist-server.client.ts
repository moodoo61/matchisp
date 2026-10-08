import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MistApiResponse } from './mist-types';

/** عميل HTTP لـ MistServer api2 — مع قفل لتعديلات المشغّلات */
@Injectable()
export class MistServerClient {
  private readonly logger = new Logger(MistServerClient.name);
  /** يمنع سباق read-modify-write على config.triggers */
  private triggersChain: Promise<void> = Promise.resolve();

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

  /** قراءة مشغّلات Mist (من config ثم النسخة الاحتياطية) */
  async readTriggers(): Promise<Record<string, unknown>> {
    const data = await this.request({ config: true, config_backup: true });
    const fromConfig = asTriggerMap(data.config?.triggers);
    if (Object.keys(fromConfig).length) return fromConfig;
    return asTriggerMap(data.config_backup?.config?.triggers);
  }

  /**
   * تعديل مشغّلات بشكل متسلسل (قراءة → تعديل → كتابة) دون سباق مع عمليات أخرى.
   * إن أعاد المُعدِّل نفس المرجع دون تغيير جوهري يمكنه إرجاع null لتخطي الكتابة.
   */
  async updateTriggers(
    mutator: (
      current: Record<string, unknown>,
    ) =>
      | Record<string, unknown>
      | null
      | Promise<Record<string, unknown> | null>,
  ): Promise<void> {
    const run = this.triggersChain.then(async () => {
      const current = await this.readTriggers();
      const next = await mutator({ ...current });
      if (!next) return;
      await this.request({ config: { triggers: next } });
    });
    this.triggersChain = run.then(
      () => undefined,
      () => undefined,
    );
    await run;
  }
}

function asTriggerMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as Record<string, unknown>) };
}
