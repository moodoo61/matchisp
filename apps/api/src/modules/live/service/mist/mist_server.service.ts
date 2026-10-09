import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MistServerClient } from './mist-server.client';
import {
  ACTIVE_STREAM_STAT_FIELDS,
  parseActiveStreamStats,
} from './mist-active-stats';
import {
  INPUT_CLIENT_REQUEST,
  parseInputStats,
} from './mist-input-stats';
import {
  mistVideoTrackLabel,
  parseStreamVideoTracks,
  type MistVideoTrackSize,
} from './mist-stream-tracks';
import type {
  MistActiveStreamStats,
  MistInputStats,
  MistStreamPayload,
  MistStreamStatus,
} from './mist-types';

export type MistTsQualityOption = {
  width: number;
  height: number | null;
  label: string;
};

/** مزامنة وإدارة قنوات MistServer */
@Injectable()
export class MistServerService {
  private readonly logger = new Logger(MistServerService.name);

  constructor(private readonly client: MistServerClient) {}

  async listStreamStatuses(): Promise<Map<string, MistStreamStatus>> {
    const map = new Map<string, MistStreamStatus>();
    if (!this.client.enabled()) return map;

    try {
      const data = await this.client.request({
        streams: true,
        active_streams: true,
      });
      const streams = data.streams ?? {};
      const active = new Set(
        Array.isArray(data.active_streams) ? data.active_streams : [],
      );

      for (const [name, raw] of Object.entries(streams)) {
        if (name === 'incomplete list') continue;
        const onlineRaw = raw?.online;
        const online =
          onlineRaw === 0 || onlineRaw === 1 || onlineRaw === 2
            ? onlineRaw
            : null;
        const error =
          typeof raw?.error === 'string' && raw.error.trim()
            ? raw.error.trim()
            : null;
        map.set(name, {
          name,
          configured: true,
          online,
          error,
          source: typeof raw?.source === 'string' ? raw.source : null,
          active: active.has(name),
          viewers: 0,
          connectedSec: null,
          downBytes: null,
          downBps: null,
        });
      }
    } catch (err) {
      this.logger.warn(
        `تعذر جلب حالات MistServer: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    return map;
  }

  async listActiveStreamStats(): Promise<Map<string, MistActiveStreamStats>> {
    const empty = new Map<string, MistActiveStreamStats>();
    if (!this.client.enabled()) return empty;

    try {
      const data = await this.client.request({
        active_streams: ACTIVE_STREAM_STAT_FIELDS,
      });
      return parseActiveStreamStats(data.active_streams);
    } catch (err) {
      this.logger.warn(
        `تعذر جلب إحصاءات MistServer: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return empty;
    }
  }

  /**
   * جودات فيديو القناة من Mist (عروض المسارات) لاستخدام ?video=عرضxارتفاع
   * @see https://docs.mistserver.org/mistserver/integration/http/json/
   */
  async listStreamTsQualities(): Promise<Map<string, MistTsQualityOption[]>> {
    const empty = new Map<string, MistTsQualityOption[]>();
    if (!this.client.enabled()) return empty;

    try {
      const data = await this.client.request({
        streams: true,
        active_streams: { longform: true },
        minimal: 1,
      });
      const parsed = parseStreamVideoTracks(data.streams, data.active_streams);
      const out = new Map<string, MistTsQualityOption[]>();
      for (const [name, tracks] of parsed) {
        out.set(
          name,
          tracks.map((track: MistVideoTrackSize) => ({
            width: track.width,
            height: track.height,
            label: mistVideoTrackLabel(track),
          })),
        );
      }
      return out;
    } catch (err) {
      this.logger.warn(
        `تعذر جلب مسارات فيديو MistServer: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return empty;
    }
  }

  /** Current inputs — clients API كما في صفحة حالة الستريم */
  async listInputStats(): Promise<Map<string, MistInputStats>> {
    const empty = new Map<string, MistInputStats>();
    if (!this.client.enabled()) return empty;

    try {
      const data = await this.client.request({
        clients: INPUT_CLIENT_REQUEST,
      });
      return parseInputStats(data.clients);
    } catch (err) {
      this.logger.warn(
        `تعذر جلب مدخلات MistServer: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return empty;
    }
  }

  statusFor(
    name: string,
    all: Map<string, MistStreamStatus>,
    viewers = 0,
    input: MistInputStats | null = null,
  ): MistStreamStatus {
    const base = all.get(name) ?? {
      name,
      configured: false,
      online: null,
      error: null,
      source: null,
      active: false,
      viewers: 0,
      connectedSec: null,
      downBytes: null,
      downBps: null,
    };
    return {
      ...base,
      viewers,
      connectedSec: input && input.conntime > 0 ? input.conntime : null,
      downBytes: input ? input.down : null,
      downBps: input ? input.downbps : null,
    };
  }

  async upsertStream(payload: MistStreamPayload) {
    if (!this.client.enabled()) {
      this.logger.warn('MistServer sync skipped (disabled)');
      return;
    }
    const name = payload.name.trim();
    const source = payload.source.trim();
    if (!name || !source) {
      throw new ServiceUnavailableException(
        'اسم ومصدر MistServer مطلوبان للمزامنة',
      );
    }

    const data = await this.client.request({
      addstream: {
        [name]: {
          name,
          source,
          always_on: Boolean(payload.alwaysOn),
        },
      },
    });
    const stream = data?.streams?.[name];
    if (!stream) {
      throw new ServiceUnavailableException(
        `تعذر تسجيل القناة على MistServer (${name})`,
      );
    }
    this.logger.log(`MistServer upsert ok: ${name} → ${source}`);
  }

  async deleteStream(name: string) {
    if (!this.client.enabled()) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const data = await this.client.request({ deletestream: trimmed });
    if (data?.streams && trimmed in data.streams) {
      throw new ServiceUnavailableException(
        `تعذر حذف القناة من MistServer (${trimmed})`,
      );
    }
    this.logger.log(`MistServer delete ok: ${trimmed}`);
  }

  /** إيقاف جلسات القناة بلطف (Stop sessions) */
  async stopSessions(name: string) {
    if (!this.client.enabled()) {
      throw new ServiceUnavailableException('MistServer معطّل من الإعدادات');
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ServiceUnavailableException('اسم القناة مطلوب');
    }
    await this.client.request({ stop_sessions: trimmed });
    this.logger.log(`MistServer stop_sessions ok: ${trimmed}`);
  }

  /** إيقاف قسري وتنظيف ذاكرة القناة (Nuke stream) */
  async nukeStream(name: string) {
    if (!this.client.enabled()) {
      throw new ServiceUnavailableException('MistServer معطّل من الإعدادات');
    }
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ServiceUnavailableException('اسم القناة مطلوب');
    }
    await this.client.request({ nuke_stream: trimmed });
    this.logger.log(`MistServer nuke_stream ok: ${trimmed}`);
  }

  ping() {
    return this.client.ping();
  }
}
