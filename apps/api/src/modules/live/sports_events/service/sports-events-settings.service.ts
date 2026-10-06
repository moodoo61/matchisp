import { Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  AUTO_CLEAR_HOURS_MAX,
  AUTO_CLEAR_HOURS_MIN,
  DEFAULT_EXTERNAL_MATCHES_URL,
  DEFAULT_SPORTS_EVENTS_SETTINGS,
  SYNC_INTERVAL_MIN_TOTAL_SECONDS,
  SYNC_MINUTES_MAX,
  SYNC_MINUTES_MIN,
  SYNC_SECONDS_MAX,
  SYNC_SECONDS_MIN,
  SPORTS_EVENTS_SETTINGS_META_KEY,
  syncIntervalTotalSeconds,
  type SportsEventsAutoClearMode,
  type SportsEventsSettings,
} from '../constants/sports-events-settings';
import { UpdateSportsEventsSettingsDto } from '../dto/update-sports-events-settings.dto';

type LegacySettings = Partial<SportsEventsSettings> & {
  externalSyncIntervalMinutes?: number;
};

@Injectable()
export class SportsEventsSettingsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  async getSettings(): Promise<SportsEventsSettings> {
    return this.loadSettings();
  }

  /** تحديث داخلي للجدولة بدون سجل تدقيق مستخدم */
  async persistSettings(next: SportsEventsSettings) {
    await this.prisma.sectionMeta.upsert({
      where: { key: SPORTS_EVENTS_SETTINGS_META_KEY },
      create: {
        key: SPORTS_EVENTS_SETTINGS_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });
  }

  async updateSettings(dto: UpdateSportsEventsSettingsDto, actorId: string) {
    const current = await this.loadSettings();
    const generalInterval = normalizeIntervalParts(
      dto.externalSyncGeneralIntervalMinutes,
      dto.externalSyncGeneralIntervalSeconds,
      current.externalSyncGeneralIntervalMinutes,
      current.externalSyncGeneralIntervalSeconds,
    );
    const liveInterval = normalizeIntervalParts(
      dto.externalSyncLiveIntervalMinutes,
      dto.externalSyncLiveIntervalSeconds,
      current.externalSyncLiveIntervalMinutes,
      current.externalSyncLiveIntervalSeconds,
    );
    const next: SportsEventsSettings = {
      enabled:
        typeof dto.enabled === 'boolean' ? dto.enabled : current.enabled,
      title: normalizeText(dto.title, current.title, 80),
      timezone: normalizeTimezone(dto.timezone, current.timezone),
      autoClearEnabled:
        typeof dto.autoClearEnabled === 'boolean'
          ? dto.autoClearEnabled
          : current.autoClearEnabled,
      autoClearMode: normalizeAutoClearMode(
        dto.autoClearMode,
        current.autoClearMode,
      ),
      autoClearAfterHours: normalizeHours(
        dto.autoClearAfterHours,
        current.autoClearAfterHours,
      ),
      lastFullClearAt: current.lastFullClearAt,
      externalSyncEnabled:
        typeof dto.externalSyncEnabled === 'boolean'
          ? dto.externalSyncEnabled
          : current.externalSyncEnabled,
      externalSyncUrl: normalizeUrl(
        dto.externalSyncUrl,
        current.externalSyncUrl,
      ),
      externalSyncGeneralEnabled:
        typeof dto.externalSyncGeneralEnabled === 'boolean'
          ? dto.externalSyncGeneralEnabled
          : current.externalSyncGeneralEnabled,
      externalSyncGeneralIntervalMinutes: generalInterval.minutes,
      externalSyncGeneralIntervalSeconds: generalInterval.seconds,
      lastExternalSyncGeneralAt: current.lastExternalSyncGeneralAt,
      externalSyncLiveEnabled:
        typeof dto.externalSyncLiveEnabled === 'boolean'
          ? dto.externalSyncLiveEnabled
          : current.externalSyncLiveEnabled,
      externalSyncLiveIntervalMinutes: liveInterval.minutes,
      externalSyncLiveIntervalSeconds: liveInterval.seconds,
      lastExternalSyncLiveAt: current.lastExternalSyncLiveAt,
      lastExternalSyncAt: current.lastExternalSyncAt,
    };

    await this.persistSettings(next);

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.sports_events.settings',
      resourceId: SPORTS_EVENTS_SETTINGS_META_KEY,
      metadata: {
        enabled: next.enabled,
        timezone: next.timezone,
        autoClearEnabled: next.autoClearEnabled,
        externalSyncEnabled: next.externalSyncEnabled,
        externalSyncGeneralEnabled: next.externalSyncGeneralEnabled,
        externalSyncLiveEnabled: next.externalSyncLiveEnabled,
      },
    });

    return next;
  }

  private async loadSettings(): Promise<SportsEventsSettings> {
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: SPORTS_EVENTS_SETTINGS_META_KEY },
    });
    if (!row?.value) return { ...DEFAULT_SPORTS_EVENTS_SETTINGS };
    try {
      const parsed = JSON.parse(row.value) as LegacySettings;
      const legacyMinutes =
        typeof parsed.externalSyncIntervalMinutes === 'number'
          ? parsed.externalSyncIntervalMinutes
          : undefined;

      const generalMinutes =
        typeof parsed.externalSyncGeneralIntervalMinutes === 'number'
          ? parsed.externalSyncGeneralIntervalMinutes
          : (legacyMinutes ??
            DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncGeneralIntervalMinutes);
      const generalSeconds =
        typeof parsed.externalSyncGeneralIntervalSeconds === 'number'
          ? parsed.externalSyncGeneralIntervalSeconds
          : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncGeneralIntervalSeconds;

      const liveMinutes =
        typeof parsed.externalSyncLiveIntervalMinutes === 'number'
          ? parsed.externalSyncLiveIntervalMinutes
          : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncLiveIntervalMinutes;
      const liveSeconds =
        typeof parsed.externalSyncLiveIntervalSeconds === 'number'
          ? parsed.externalSyncLiveIntervalSeconds
          : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncLiveIntervalSeconds;

      const generalPair = normalizeIntervalParts(
        generalMinutes,
        generalSeconds,
        DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncGeneralIntervalMinutes,
        DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncGeneralIntervalSeconds,
      );
      const livePair = normalizeIntervalParts(
        liveMinutes,
        liveSeconds,
        DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncLiveIntervalMinutes,
        DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncLiveIntervalSeconds,
      );

      return {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : DEFAULT_SPORTS_EVENTS_SETTINGS.enabled,
        title: normalizeText(
          parsed.title,
          DEFAULT_SPORTS_EVENTS_SETTINGS.title,
          80,
        ),
        timezone: normalizeTimezone(
          parsed.timezone,
          DEFAULT_SPORTS_EVENTS_SETTINGS.timezone,
        ),
        autoClearEnabled:
          typeof parsed.autoClearEnabled === 'boolean'
            ? parsed.autoClearEnabled
            : DEFAULT_SPORTS_EVENTS_SETTINGS.autoClearEnabled,
        autoClearMode: normalizeAutoClearMode(
          parsed.autoClearMode,
          DEFAULT_SPORTS_EVENTS_SETTINGS.autoClearMode,
        ),
        autoClearAfterHours: normalizeHours(
          parsed.autoClearAfterHours,
          DEFAULT_SPORTS_EVENTS_SETTINGS.autoClearAfterHours,
        ),
        lastFullClearAt:
          typeof parsed.lastFullClearAt === 'string'
            ? parsed.lastFullClearAt
            : null,
        externalSyncEnabled:
          typeof parsed.externalSyncEnabled === 'boolean'
            ? parsed.externalSyncEnabled
            : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncEnabled,
        externalSyncUrl: normalizeUrl(
          parsed.externalSyncUrl,
          DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncUrl,
        ),
        externalSyncGeneralEnabled:
          typeof parsed.externalSyncGeneralEnabled === 'boolean'
            ? parsed.externalSyncGeneralEnabled
            : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncGeneralEnabled,
        externalSyncGeneralIntervalMinutes: generalPair.minutes,
        externalSyncGeneralIntervalSeconds: generalPair.seconds,
        lastExternalSyncGeneralAt:
          typeof parsed.lastExternalSyncGeneralAt === 'string'
            ? parsed.lastExternalSyncGeneralAt
            : null,
        externalSyncLiveEnabled:
          typeof parsed.externalSyncLiveEnabled === 'boolean'
            ? parsed.externalSyncLiveEnabled
            : DEFAULT_SPORTS_EVENTS_SETTINGS.externalSyncLiveEnabled,
        externalSyncLiveIntervalMinutes: livePair.minutes,
        externalSyncLiveIntervalSeconds: livePair.seconds,
        lastExternalSyncLiveAt:
          typeof parsed.lastExternalSyncLiveAt === 'string'
            ? parsed.lastExternalSyncLiveAt
            : null,
        lastExternalSyncAt:
          typeof parsed.lastExternalSyncAt === 'string'
            ? parsed.lastExternalSyncAt
            : null,
      };
    } catch {
      return { ...DEFAULT_SPORTS_EVENTS_SETTINGS };
    }
  }
}

function normalizeText(
  value: string | null | undefined,
  fallback: string,
  max: number,
) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return fallback;
  return trimmed.slice(0, max);
}

function normalizeTimezone(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return fallback;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return trimmed;
  } catch {
    return fallback;
  }
}

function normalizeAutoClearMode(
  value: string | null | undefined,
  fallback: SportsEventsAutoClearMode,
): SportsEventsAutoClearMode {
  if (value === 'all' || value === 'after_hours') return value;
  return fallback;
}

function normalizeHours(
  value: number | null | undefined,
  fallback: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.round(value);
  if (n < AUTO_CLEAR_HOURS_MIN) return AUTO_CLEAR_HOURS_MIN;
  if (n > AUTO_CLEAR_HOURS_MAX) return AUTO_CLEAR_HOURS_MAX;
  return n;
}

function clampInt(
  value: number | null | undefined,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const n = Math.round(value);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function normalizeIntervalParts(
  minutesIn: number | null | undefined,
  secondsIn: number | null | undefined,
  minutesFallback: number,
  secondsFallback: number,
) {
  let minutes = clampInt(
    minutesIn,
    minutesFallback,
    SYNC_MINUTES_MIN,
    SYNC_MINUTES_MAX,
  );
  let seconds = clampInt(
    secondsIn,
    secondsFallback,
    SYNC_SECONDS_MIN,
    SYNC_SECONDS_MAX,
  );
  if (syncIntervalTotalSeconds(minutes, seconds) < SYNC_INTERVAL_MIN_TOTAL_SECONDS) {
    minutes = 0;
    seconds = SYNC_INTERVAL_MIN_TOTAL_SECONDS;
  }
  return { minutes, seconds };
}

function normalizeUrl(value: string | null | undefined, fallback: string) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return fallback || DEFAULT_EXTERNAL_MATCHES_URL;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}
