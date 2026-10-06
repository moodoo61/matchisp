import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SportTeamType } from '../../../../../generated/live';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import {
  syncIntervalToMs,
  type SportsEventsSettings,
} from '../constants/sports-events-settings';
import { SportsEventsSettingsService } from './sports-events-settings.service';
import type {
  ExternalMatchGoal,
  ExternalMatchItem,
  ExternalMatchTeam,
  ExternalMatchesResponse,
} from '../types/external-matches';

export type ExternalSyncMode = 'manual' | 'general' | 'live';

export type ExternalSyncResult = {
  success: true;
  mode: ExternalSyncMode;
  fetched: number;
  created: number;
  updated: number;
  removed: number;
  teamsCreated: number;
  unmatchedChannels: string[];
  syncedAt: string;
};

const FETCH_TIMEOUT_MS = 25_000;
/** مدة اعتبار المباراة «جارية» بعد الموعد إن لم تُحدَّث الحالة */
const LIVE_WINDOW_MS = 3 * 60 * 60 * 1000;

@Injectable()
export class SportMatchesExternalSyncService {
  private readonly logger = new Logger(SportMatchesExternalSyncService.name);
  private busy = false;

  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly settings: SportsEventsSettingsService,
    private readonly audit: AuditService,
  ) {}

  async syncNow(
    actorId?: string,
    mode: ExternalSyncMode = 'manual',
  ): Promise<ExternalSyncResult> {
    if (this.busy) {
      throw new BadRequestException('مزامنة جارية بالفعل');
    }
    this.busy = true;
    try {
      const cfg = await this.settings.getSettings();
      if (!cfg.externalSyncEnabled) {
        throw new BadRequestException(
          'مزامنة المصدر الخارجي غير مفعّلة في الضبط',
        );
      }

      const payload = await this.fetchMatches(cfg.externalSyncUrl);
      const result = await this.applyMatches(payload.matches);

      const syncedAt = new Date().toISOString();
      const next: SportsEventsSettings = {
        ...cfg,
        lastExternalSyncAt: syncedAt,
        lastExternalSyncGeneralAt:
          mode === 'general' || mode === 'manual'
            ? syncedAt
            : cfg.lastExternalSyncGeneralAt,
        lastExternalSyncLiveAt:
          mode === 'live' || mode === 'manual'
            ? syncedAt
            : cfg.lastExternalSyncLiveAt,
      };
      await this.settings.persistSettings(next);

      await this.audit.log({
        actorId,
        action: 'sync',
        resource: 'live.sports_events.external',
        metadata: {
          mode,
          url: cfg.externalSyncUrl,
          fetched: result.fetched,
          created: result.created,
          updated: result.updated,
          removed: result.removed,
          teamsCreated: result.teamsCreated,
          unmatchedChannels: result.unmatchedChannels,
          syncedAt,
        },
      });

      return {
        success: true as const,
        mode,
        fetched: result.fetched,
        created: result.created,
        updated: result.updated,
        removed: result.removed,
        teamsCreated: result.teamsCreated,
        unmatchedChannels: result.unmatchedChannels,
        syncedAt,
      };
    } finally {
      this.busy = false;
    }
  }

  /** تشغيل داخلي للجدولة — مزامنة عامة و/أو أثناء المباريات الجارية */
  async syncIfDue() {
    const cfg = await this.settings.getSettings();
    if (!cfg.externalSyncEnabled) return;

    const now = Date.now();

    if (cfg.externalSyncLiveEnabled) {
      const liveDue = isIntervalDue(
        cfg.lastExternalSyncLiveAt,
        syncIntervalToMs(
          cfg.externalSyncLiveIntervalMinutes,
          cfg.externalSyncLiveIntervalSeconds,
        ),
        now,
      );
      if (liveDue && (await this.hasStartedUnfinishedMatch(now))) {
        try {
          await this.syncNow(undefined, 'live');
          return;
        } catch (err) {
          this.logger.warn(
            `فشل مزامنة المباريات الجارية: ${err instanceof Error ? err.message : err}`,
          );
        }
      }
    }

    if (cfg.externalSyncGeneralEnabled) {
      const generalDue = isIntervalDue(
        cfg.lastExternalSyncGeneralAt,
        syncIntervalToMs(
          cfg.externalSyncGeneralIntervalMinutes,
          cfg.externalSyncGeneralIntervalSeconds,
        ),
        now,
      );
      if (!generalDue) return;
      try {
        await this.syncNow(undefined, 'general');
      } catch (err) {
        this.logger.warn(
          `فشل المزامنة العامة: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  /** هل توجد مباراة حان موعدها ولم تُعلَم منتهية؟ */
  async hasStartedUnfinishedMatch(nowMs = Date.now()) {
    const now = new Date(nowMs);
    const oldest = new Date(nowMs - LIVE_WINDOW_MS);
    const count = await this.prisma.sportMatch.count({
      where: {
        kickoffAt: { lte: now, gte: oldest },
        OR: [{ status: null }, { status: { not: 'انتهت' } }],
      },
    });
    return count > 0;
  }

  private async fetchMatches(url: string): Promise<ExternalMatchesResponse> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        `تعذر الاتصال بالمصدر الخارجي: ${err instanceof Error ? err.message : err}`,
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        `المصدر الخارجي أعاد حالة ${response.status}`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new BadRequestException('استجابة المصدر ليست JSON صالحاً');
    }

    const matches = (body as { matches?: unknown })?.matches;
    if (!Array.isArray(matches)) {
      throw new BadRequestException('استجابة المصدر بلا قائمة matches');
    }

    return {
      matches: matches.filter(isExternalMatchItem),
    };
  }

  private async applyMatches(
    items: ExternalMatchItem[],
  ): Promise<{
    fetched: number;
    created: number;
    updated: number;
    removed: number;
    teamsCreated: number;
    unmatchedChannels: string[];
  }> {
    const channels = await this.prisma.channel.findMany({
      select: { id: true, label: true },
    });
    const channelByLabel = new Map(
      channels.map((c) => [normalizeLabel(c.label), c.id]),
    );

    const unmatchedChannels = new Set<string>();
    let created = 0;
    let updated = 0;
    let teamsCreated = 0;
    const seenExternalIds: string[] = [];

    for (const item of items) {
      const externalId = String(item.id);
      seenExternalIds.push(externalId);

      const home = await this.upsertTeam(item.home_team);
      if (home.created) teamsCreated += 1;
      const away = await this.upsertTeam(item.away_team);
      if (away.created) teamsCreated += 1;

      if (home.id === away.id) {
        this.logger.warn(
          `تخطي مباراة ${externalId}: الفريقان متطابقان بعد المزامنة`,
        );
        continue;
      }

      const labels = Array.isArray(item.channels)
        ? item.channels.map((c) => String(c).trim()).filter(Boolean)
        : [];
      let channelId: string | null = null;
      for (const label of labels) {
        const id = channelByLabel.get(normalizeLabel(label));
        if (id) {
          channelId = id;
          break;
        }
        unmatchedChannels.add(label);
      }

      const kickoffAt = new Date(item.kickoff_at);
      if (Number.isNaN(kickoffAt.getTime())) {
        this.logger.warn(`تخطي مباراة ${externalId}: kickoff_at غير صالح`);
        continue;
      }

      const goalsJson = sanitizeGoals(item.goals);
      const data = {
        tournament: String(item.league || '').trim() || 'بطولة',
        homeTeamId: home.id,
        awayTeamId: away.id,
        kickoffAt,
        channelId,
        status: String(item.status || '').trim() || null,
        homeGoals: toNullableInt(item.home_goals),
        awayGoals: toNullableInt(item.away_goals),
        channelLabels: labels,
        goalsJson,
      };

      const existing = await this.prisma.sportMatch.findUnique({
        where: { externalId },
        select: { id: true },
      });

      if (existing) {
        await this.prisma.sportMatch.update({
          where: { id: existing.id },
          data,
        });
        updated += 1;
      } else {
        await this.prisma.sportMatch.create({
          data: { ...data, externalId },
        });
        created += 1;
      }
    }

    // حذف مباريات مزامَنة لم تعد في المصدر
    let removed = 0;
    if (seenExternalIds.length) {
      const stale = await this.prisma.sportMatch.deleteMany({
        where: {
          AND: [
            { externalId: { not: null } },
            { externalId: { notIn: seenExternalIds } },
          ],
        },
      });
      removed = stale.count;
    } else {
      const stale = await this.prisma.sportMatch.deleteMany({
        where: { externalId: { not: null } },
      });
      removed = stale.count;
    }

    return {
      fetched: items.length,
      created,
      updated,
      removed,
      teamsCreated,
      unmatchedChannels: [...unmatchedChannels].sort((a, b) =>
        a.localeCompare(b, 'ar'),
      ),
    };
  }

  private async upsertTeam(team: ExternalMatchTeam) {
    const externalId = String(team.id);
    const name = String(team.name || '').trim();
    if (!name) {
      throw new BadRequestException(`فريق بلا اسم (externalId=${externalId})`);
    }
    const logoUrl = team.logo_url?.trim() || null;

    const byExternal = await this.prisma.sportTeam.findUnique({
      where: { externalId },
    });
    if (byExternal) {
      const updated = await this.prisma.sportTeam.update({
        where: { id: byExternal.id },
        data: {
          name,
          ...(logoUrl ? { logoUrl } : {}),
        },
      });
      return { id: updated.id, created: false };
    }

    const byName = await this.prisma.sportTeam.findFirst({
      where: { name, type: SportTeamType.NATIONAL },
    });
    if (byName) {
      const updated = await this.prisma.sportTeam.update({
        where: { id: byName.id },
        data: {
          externalId: byName.externalId ?? externalId,
          ...(logoUrl ? { logoUrl } : {}),
        },
      });
      return { id: updated.id, created: false };
    }

    const created = await this.prisma.sportTeam.create({
      data: {
        name,
        type: SportTeamType.NATIONAL,
        logoUrl,
        externalId,
      },
    });
    return { id: created.id, created: true };
  }
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function toNullableInt(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value);
}

function sanitizeGoals(goals: ExternalMatchGoal[] | undefined) {
  if (!Array.isArray(goals)) return [];
  return goals.map((g) => ({
    minute: typeof g.minute === 'number' ? g.minute : null,
    extraMinute: typeof g.extra_minute === 'number' ? g.extra_minute : null,
    minuteLabel: String(g.minute_label || ''),
    player: String(g.player || ''),
    assist: g.assist == null ? null : String(g.assist),
    team: String(g.team || ''),
    isHome: Boolean(g.is_home),
    detail: String(g.detail || ''),
  }));
}

function isExternalMatchItem(value: unknown): value is ExternalMatchItem {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'number' &&
    typeof row.league === 'string' &&
    typeof row.kickoff_at === 'string' &&
    typeof row.home_team === 'object' &&
    row.home_team != null &&
    typeof row.away_team === 'object' &&
    row.away_team != null
  );
}

function isIntervalDue(
  lastIso: string | null | undefined,
  intervalMs: number,
  nowMs: number,
) {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return false;
  const last = lastIso ? Date.parse(lastIso) : NaN;
  return !Number.isFinite(last) || nowMs - last >= intervalMs;
}
