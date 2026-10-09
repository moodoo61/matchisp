import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  absolutizeMistPlaybackUrl,
  resolveServerMistHttpBase,
} from './mist-http-base';
import { MistPlaybackService } from './mist-playback.service';
import { MistServerClient } from './mist-server.client';

type WakeSession = {
  controller: AbortController;
  startedAt: number;
};

/**
 * إيقاظ ستريم Mist غير نشط عبر طلب رابط التشغيل الحقيقي.
 * Mist يشغّل الـ input عند وجود output يطلب الستريم (online: 2 → 1)،
 * ويوقفّه عند اختفاء كل المشاهدين — لذلك نبقي الاتصال مفتوحاً حتى يلتقط المشغّل.
 *
 * @see https://docs.mistserver.org/mistserver/concepts/streams/ (Always on)
 * @see Mist online: 0=error, 1=active, 2=inactive
 */
@Injectable()
export class MistStreamWakeService {
  private readonly logger = new Logger(MistStreamWakeService.name);
  private readonly sessions = new Map<string, WakeSession>();

  /** أقصى مدة للإبقاء على اتصال الإيقاظ */
  private readonly holdMs = 45_000;

  constructor(
    private readonly config: ConfigService,
    private readonly mistClient: MistServerClient,
    private readonly playback: MistPlaybackService,
  ) {}

  /**
   * يبدأ طلب GET على رابط TS (مع tkn إن لزم) ويبقي الجسم مفتوحاً.
   * استدعاء متكرر لنفس القناة لا يفتح اتصالاً ثانياً.
   */
  ensureWake(streamName: string, options?: { signed?: boolean }): void {
    const name = streamName.trim();
    if (!name || !this.mistClient.enabled()) return;

    const existing = this.sessions.get(name);
    if (existing && Date.now() - existing.startedAt < this.holdMs) {
      return;
    }
    if (existing) {
      existing.controller.abort();
      this.sessions.delete(name);
    }

    const httpBase = resolveServerMistHttpBase(
      this.config.get<string>('MISTSERVER_HTTP_URL'),
      this.mistClient.apiUrl(),
    );
    const urls = this.playback.urlsFor(name, { signed: options?.signed });
    const absolute = absolutizeMistPlaybackUrl(httpBase, urls.tsUrl);
    if (!absolute) {
      this.logger.warn(`لا رابط TS لإيقاظ Mist: ${name}`);
      return;
    }

    const controller = new AbortController();
    this.sessions.set(name, { controller, startedAt: Date.now() });
    const holdTimer = setTimeout(() => controller.abort(), this.holdMs);

    void this.holdOutputConnection(name, absolute, controller.signal).finally(
      () => {
        clearTimeout(holdTimer);
        const cur = this.sessions.get(name);
        if (cur?.controller === controller) {
          this.sessions.delete(name);
        }
      },
    );
  }

  /** يحرّر اتصال الإيقاظ بعد أن يتولى مشغّل العميل الستريم */
  releaseWake(streamName: string): void {
    const name = streamName.trim();
    const session = this.sessions.get(name);
    if (!session) return;
    session.controller.abort();
    this.sessions.delete(name);
  }

  private async holdOutputConnection(
    streamName: string,
    url: string,
    signal: AbortSignal,
  ): Promise<void> {
    this.logger.log(`إيقاظ Mist عبر طلب التشغيل: ${streamName}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: '*/*' },
        signal,
        // لا نمرّر كوكيز المتصفح — التوكن في الاستعلام إن وُجد
        cache: 'no-store',
      });

      if (!response.ok) {
        this.logger.warn(
          `إيقاظ Mist رُفض لـ ${streamName}: HTTP ${response.status}`,
        );
        return;
      }

      const body = response.body;
      if (!body) return;

      const reader = body.getReader();
      try {
        while (!signal.aborted) {
          const { done } = await reader.read();
          if (done) break;
        }
      } finally {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      if (signal.aborted) return;
      this.logger.warn(
        `تعذر إيقاظ Mist لـ ${streamName}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
