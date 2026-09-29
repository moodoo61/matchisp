import { Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  AUTO_CLEAR_HOURS_MAX,
  AUTO_CLEAR_HOURS_MIN,
  DEFAULT_SPORTS_EVENTS_SETTINGS,
  SPORTS_EVENTS_SETTINGS_META_KEY,
  type SportsEventsAutoClearMode,
  type SportsEventsSettings,
} from '../constants/sports-events-settings';
import { UpdateSportsEventsSettingsDto } from '../dto/update-sports-events-settings.dto';

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
        autoClearMode: next.autoClearMode,
        autoClearAfterHours: next.autoClearAfterHours,
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
      const parsed = JSON.parse(row.value) as Partial<SportsEventsSettings>;
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
