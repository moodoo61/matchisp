import { Injectable } from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';

/** منطقة توقيت تجميع «اليوم» للتقارير */
const REPORTS_TZ = 'Asia/Baghdad';

export type ViewingSessionReportDto = {
  id: string;
  sessionId: string;
  streamName: string;
  /** اسم العرض العربي من جدول القنوات */
  channelLabel: string;
  connector: string;
  connectionAddress: string;
  durationSec: number;
  uploadedBytes: string;
  downloadedBytes: string;
  tags: string;
  endedAt: string;
  createdAt: string;
};

export type ViewingReportsSummary = {
  totalSessions: number;
  totalDurationSec: number;
  totalDownloadedBytes: string;
  byStream: Array<{
    streamName: string;
    channelLabel: string;
    sessions: number;
    durationSec: number;
    downloadedBytes: string;
  }>;
};

export type ViewingReportsDayRow = {
  /** YYYY-MM-DD بتوقيت بغداد */
  day: string;
  sessions: number;
  durationSec: number;
  downloadedBytes: string;
  channels: number;
};

export type ViewingReportsTimelinePoint = {
  /** مفتاح الفترة: YYYY-MM-DD أو YYYY-MM-DDTHH */
  key: string;
  sessions: number;
};

export type ViewingReportsTimeline = {
  bucket: 'hour' | 'day';
  points: ViewingReportsTimelinePoint[];
};

/**
 * استقبال وتحليل جلسات USER_END.
 * @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_END
 */
@Injectable()
export class ViewingReportsService {
  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly audit: AuditService,
  ) {}

  async ingestUserEndPayload(raw: string) {
    const lines = raw.replace(/\r/g, '').split('\n');
    const sessionId = (lines[0] ?? '').trim();
    const streamName = (lines[1] ?? '').trim();
    if (!sessionId || !streamName) {
      return { ok: false, reason: 'missing session or stream' };
    }

    const connector = (lines[2] ?? '').trim();
    const connectionAddress = (lines[3] ?? '').trim();
    const durationSec = parseNonNegInt(lines[4]);
    const uploadedBytes = parseBigIntSafe(lines[5]);
    const downloadedBytes = parseBigIntSafe(lines[6]);
    const tags = (lines[7] ?? '').trim();

    const row = await this.prisma.viewingSessionReport.create({
      data: {
        sessionId,
        streamName,
        connector,
        connectionAddress,
        durationSec,
        uploadedBytes,
        downloadedBytes,
        tags,
      },
    });

    return { ok: true, id: row.id };
  }

  async list(params: {
    streamName?: string;
    /** يوم YYYY-MM-DD بتوقيت بغداد */
    day?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: ViewingSessionReportDto[]; total: number }> {
    const take = Math.min(Math.max(params.limit ?? 50, 1), 200);
    const skip = Math.max(params.offset ?? 0, 0);
    const where: {
      streamName?: string;
      endedAt?: { gte: Date; lt: Date };
    } = {};

    if (params.streamName?.trim()) {
      where.streamName = params.streamName.trim();
    }
    if (params.day?.trim()) {
      const range = dayRangeUtc(params.day.trim());
      if (!range) {
        return { items: [], total: 0 };
      }
      where.endedAt = range;
    }

    const [rows, total, labels] = await Promise.all([
      this.prisma.viewingSessionReport.findMany({
        where,
        orderBy: { endedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.viewingSessionReport.count({ where }),
      this.channelLabelMap(),
    ]);

    return {
      total,
      items: rows.map((row) => mapRow(row, labels)),
    };
  }

  async summary(hours = 24): Promise<ViewingReportsSummary> {
    const since = new Date(Date.now() - Math.max(hours, 1) * 3600_000);
    const [rows, labels] = await Promise.all([
      this.prisma.viewingSessionReport.findMany({
        where: { endedAt: { gte: since } },
        select: {
          streamName: true,
          durationSec: true,
          downloadedBytes: true,
        },
      }),
      this.channelLabelMap(),
    ]);

    const byStreamMap = new Map<
      string,
      { sessions: number; durationSec: number; downloadedBytes: bigint }
    >();
    let totalDurationSec = 0;
    let totalDownloaded = 0n;

    for (const row of rows) {
      totalDurationSec += row.durationSec;
      totalDownloaded += row.downloadedBytes;
      const cur = byStreamMap.get(row.streamName) ?? {
        sessions: 0,
        durationSec: 0,
        downloadedBytes: 0n,
      };
      cur.sessions += 1;
      cur.durationSec += row.durationSec;
      cur.downloadedBytes += row.downloadedBytes;
      byStreamMap.set(row.streamName, cur);
    }

    const byStream = [...byStreamMap.entries()]
      .map(([streamName, v]) => ({
        streamName,
        channelLabel: labels.get(streamName) || streamName,
        sessions: v.sessions,
        durationSec: v.durationSec,
        downloadedBytes: v.downloadedBytes.toString(),
      }))
      .sort((a, b) => b.durationSec - a.durationSec);

    return {
      totalSessions: rows.length,
      totalDurationSec,
      totalDownloadedBytes: totalDownloaded.toString(),
      byStream,
    };
  }

  /** تجميع الجلسات حسب اليوم (توقيت بغداد) */
  async byDay(hours = 24 * 30): Promise<{ days: ViewingReportsDayRow[] }> {
    const since = new Date(Date.now() - Math.max(hours, 1) * 3600_000);
    const rows = await this.prisma.viewingSessionReport.findMany({
      where: { endedAt: { gte: since } },
      select: {
        streamName: true,
        durationSec: true,
        downloadedBytes: true,
        endedAt: true,
      },
    });

    const map = new Map<
      string,
      {
        sessions: number;
        durationSec: number;
        downloadedBytes: bigint;
        channels: Set<string>;
      }
    >();

    for (const row of rows) {
      const day = formatDayInTz(row.endedAt, REPORTS_TZ);
      const cur = map.get(day) ?? {
        sessions: 0,
        durationSec: 0,
        downloadedBytes: 0n,
        channels: new Set<string>(),
      };
      cur.sessions += 1;
      cur.durationSec += row.durationSec;
      cur.downloadedBytes += row.downloadedBytes;
      cur.channels.add(row.streamName);
      map.set(day, cur);
    }

    const days = [...map.entries()]
      .map(([day, v]) => ({
        day,
        sessions: v.sessions,
        durationSec: v.durationSec,
        downloadedBytes: v.downloadedBytes.toString(),
        channels: v.channels.size,
      }))
      .sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));

    return { days };
  }

  /**
   * خط زمني لعدد الجلسات.
   * ≤ 7 أيام → تجميع بالساعة · أطول → باليوم (توقيت بغداد).
   */
  async timeline(hours = 24): Promise<ViewingReportsTimeline> {
    const span = Math.max(hours, 1);
    const bucket: 'hour' | 'day' = span <= 24 * 7 ? 'hour' : 'day';
    const since = new Date(Date.now() - span * 3600_000);
    const rows = await this.prisma.viewingSessionReport.findMany({
      where: { endedAt: { gte: since } },
      select: { endedAt: true },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      const key =
        bucket === 'hour'
          ? formatHourInTz(row.endedAt, REPORTS_TZ)
          : formatDayInTz(row.endedAt, REPORTS_TZ);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const keys =
      bucket === 'hour'
        ? buildHourKeys(span, REPORTS_TZ)
        : buildDayKeys(Math.ceil(span / 24), REPORTS_TZ);

    return {
      bucket,
      points: keys.map((key) => ({
        key,
        sessions: counts.get(key) ?? 0,
      })),
    };
  }

  async clearAll(actorId: string) {
    const result = await this.prisma.viewingSessionReport.deleteMany({});
    await this.audit.log({
      actorId,
      action: 'delete',
      resource: 'live.viewing_reports',
      resourceId: 'all',
      metadata: { count: result.count },
    });
    return { deleted: result.count };
  }

  private async channelLabelMap(): Promise<Map<string, string>> {
    const channels = await this.prisma.channel.findMany({
      select: { name: true, label: true },
    });
    return new Map(channels.map((c) => [c.name, c.label]));
  }
}

function mapRow(
  row: {
    id: string;
    sessionId: string;
    streamName: string;
    connector: string;
    connectionAddress: string;
    durationSec: number;
    uploadedBytes: bigint;
    downloadedBytes: bigint;
    tags: string;
    endedAt: Date;
    createdAt: Date;
  },
  labels: Map<string, string>,
): ViewingSessionReportDto {
  return {
    id: row.id,
    sessionId: row.sessionId,
    streamName: row.streamName,
    channelLabel: labels.get(row.streamName) || row.streamName,
    connector: row.connector,
    connectionAddress: row.connectionAddress,
    durationSec: row.durationSec,
    uploadedBytes: row.uploadedBytes.toString(),
    downloadedBytes: row.downloadedBytes.toString(),
    tags: row.tags,
    endedAt: row.endedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function parseNonNegInt(raw: string | undefined): number {
  const n = Number.parseInt((raw ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 2_147_483_647);
}

function parseBigIntSafe(raw: string | undefined): bigint {
  const t = (raw ?? '').trim();
  if (!/^\d+$/.test(t)) return 0n;
  try {
    return BigInt(t);
  } catch {
    return 0n;
  }
}

/** YYYY-MM-DD في المنطقة الزمنية المعطاة */
function formatDayInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** YYYY-MM-DDTHH في المنطقة الزمنية المعطاة */
function formatHourInTz(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}`;
}

function buildDayKeys(count: number, timeZone: string): string[] {
  const n = Math.max(1, count);
  const keys: string[] = [];
  const nowKey = formatDayInTz(new Date(), timeZone);
  const [y, m, d] = nowKey.split('-').map(Number);
  const cursor = Date.UTC(y, m - 1, d, 12, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    keys.push(formatDayInTz(new Date(cursor - i * 86400_000), 'UTC'));
  }
  return keys;
}

function buildHourKeys(hours: number, timeZone: string): string[] {
  const n = Math.max(1, Math.ceil(hours));
  const keys: string[] = [];
  // ابدأ من بداية الساعة الحالية في المنطقة ثم ارجع
  const nowKey = formatHourInTz(new Date(), timeZone);
  const [datePart, hourPart] = nowKey.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const hour = Number(hourPart);
  // تمثيل كـ UTC وهمي للمفاتيح فقط (نفس التسلسل الزمني)
  let cursor = Date.UTC(y, m - 1, d, hour, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(cursor - i * 3600_000);
    const yy = t.getUTCFullYear();
    const mm = String(t.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(t.getUTCDate()).padStart(2, '0');
    const hh = String(t.getUTCHours()).padStart(2, '0');
    keys.push(`${yy}-${mm}-${dd}T${hh}`);
  }
  return keys;
}

/**
 * نطاق UTC ليوم تقويمي YYYY-MM-DD بتوقيت بغداد.
 * يبني حدود اليوم عبر إزاحة معروفة لبغداد (UTC+3 بدون DST).
 */
function dayRangeUtc(day: string): { gte: Date; lt: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return null;
  // منتصف ليل بغداد = UTC لذلك اليوم ناقص 3 ساعات (UTC+3 ثابت)
  const utcMidnight = Date.UTC(y, m - 1, d);
  const gte = new Date(utcMidnight - 3 * 3600_000);
  const lt = new Date(utcMidnight + 21 * 3600_000);
  if (Number.isNaN(gte.getTime()) || Number.isNaN(lt.getTime())) return null;
  return { gte, lt };
}
