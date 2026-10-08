import { chmodSync, existsSync } from 'fs';
import { join } from 'path';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { MistServerClient } from '../../service/mist/mist-server.client';
import {
  DEFAULT_VIEWING_REPORTS_STORED,
  USER_END_SCRIPT_NAME,
  VIEWING_REPORTS_META_KEY,
  VIEWING_REPORTS_TRIGGER_MARKERS,
  type ViewingReportsSettings,
  type ViewingReportsStoredSettings,
} from '../constants/viewing-reports';

/**
 * مزامنة مشغّل USER_END عبر سكربت محلي (مثل حماية USER_NEW).
 * لا يعتمد على HTTP عام قد لا يصل إليه Mist.
 * @see https://docs.mistserver.org/mistserver/integration/triggers/list/USER_END
 */
@Injectable()
export class ViewingReportsSettingsService {
  private readonly logger = new Logger(ViewingReportsSettingsService.name);

  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly mist: MistServerClient,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async syncIfEnabled() {
    const stored = await this.loadStored();
    if (!stored.enabled) return;
    await this.syncUserEndTrigger();
  }

  async isEnabled(): Promise<boolean> {
    return (await this.loadStored()).enabled;
  }

  async verifyUserEndPresent(): Promise<boolean> {
    if (!this.mist.enabled()) return false;
    if (!(await this.isEnabled())) return false;
    try {
      const triggers = await this.mist.readTriggers();
      return listHandlers(triggers.USER_END).some((row) =>
        isOurUserEndHandler(row),
      );
    } catch {
      return false;
    }
  }

  async getSettings(): Promise<ViewingReportsSettings> {
    const stored = await this.loadStored();
    return {
      enabled: stored.enabled,
      handlerPath: this.handlerScriptPath(),
    };
  }

  async updateSettings(
    dto: { enabled?: boolean },
    actorId: string,
  ): Promise<ViewingReportsSettings> {
    const current = await this.loadStored();
    const next: ViewingReportsStoredSettings = {
      enabled:
        typeof dto.enabled === 'boolean' ? dto.enabled : current.enabled,
    };

    if (next.enabled) {
      await this.syncUserEndTrigger();
    } else if (current.enabled) {
      await this.removeUserEndTrigger();
    }

    await this.prisma.sectionMeta.upsert({
      where: { key: VIEWING_REPORTS_META_KEY },
      create: {
        key: VIEWING_REPORTS_META_KEY,
        value: JSON.stringify(next),
      },
      update: { value: JSON.stringify(next) },
    });

    await this.audit.log({
      actorId,
      action: 'update',
      resource: 'live.viewing_reports',
      resourceId: VIEWING_REPORTS_META_KEY,
      metadata: { enabled: next.enabled },
    });

    return {
      enabled: next.enabled,
      handlerPath: this.handlerScriptPath(),
    };
  }

  private handlerScriptPath(): string {
    const override = this.config
      .get<string>('MIST_USER_END_REPORT_SCRIPT')
      ?.trim();
    if (override) return override;
    const candidates = [
      `/opt/match/scripts/${USER_END_SCRIPT_NAME}`,
      join(process.cwd(), 'scripts', USER_END_SCRIPT_NAME),
      join(process.cwd(), '../../scripts', USER_END_SCRIPT_NAME),
    ];
    return candidates.find((path) => existsSync(path)) ?? candidates[0];
  }

  private async loadStored(): Promise<ViewingReportsStoredSettings> {
    const defaults = { ...DEFAULT_VIEWING_REPORTS_STORED };
    const row = await this.prisma.sectionMeta.findUnique({
      where: { key: VIEWING_REPORTS_META_KEY },
    });
    if (!row?.value) return defaults;
    try {
      const parsed = JSON.parse(
        row.value,
      ) as Partial<ViewingReportsStoredSettings>;
      return {
        enabled:
          typeof parsed.enabled === 'boolean'
            ? parsed.enabled
            : defaults.enabled,
      };
    } catch {
      return defaults;
    }
  }

  private async syncUserEndTrigger() {
    if (!this.mist.enabled()) {
      throw new ServiceUnavailableException('MistServer معطّل');
    }
    const handler = this.handlerScriptPath();
    if (!existsSync(handler)) {
      throw new ServiceUnavailableException(
        `ملف مشغّل التقارير غير موجود: ${handler}`,
      );
    }
    chmodSync(handler, 0o755);

    const streams = await this.listStreamNames();
    if (!streams.length) {
      throw new ServiceUnavailableException(
        'لا توجد قنوات نشطة في اللوحة لمزامنة USER_END',
      );
    }

    // مرّر منفذ الـ API للسكربت عبر env غير متاح لـ Mist — السكربت يقرأ API_PORT من البيئة
    // أو الافتراضي 3001. نحدّث السكربت ليستخدم ملف/افتراضي.
    await this.mist.updateTriggers((current) => {
      const existing = listHandlers(current.USER_END);
      const others = existing.filter((row) => !isOurUserEndHandler(row));
      const ours = {
        handler,
        sync: false,
        streams,
        default: '1',
      };
      return { ...current, USER_END: [...others, ours] };
    });
    this.logger.log(
      `USER_END تقارير اللوحة → ${handler} (${streams.length} قناة)`,
    );
  }

  private async removeUserEndTrigger() {
    if (!this.mist.enabled()) return;
    try {
      await this.mist.updateTriggers((current) => {
        const existing = listHandlers(current.USER_END);
        const hasOurs = existing.some((row) => isOurUserEndHandler(row));
        if (!hasOurs) return null;
        const rows = existing.filter((row) => !isOurUserEndHandler(row));
        const next = { ...current };
        if (rows.length) next.USER_END = rows;
        else delete next.USER_END;
        return next;
      });
    } catch (err) {
      this.logger.warn(
        `تعذر إزالة USER_END: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async listStreamNames(): Promise<string[]> {
    const rows = await this.prisma.channel.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return [
      ...new Set(
        rows.map((r) => r.name.trim()).filter((n) => n.length > 0),
      ),
    ];
  }
}

function listHandlers(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === 'string') return [value];
  return value.filter((row) => {
    if (Array.isArray(row) && typeof row[0] === 'string') return true;
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      return typeof (row as { handler?: string }).handler === 'string';
    }
    return false;
  });
}

function handlerOf(row: unknown): string | null {
  if (typeof row === 'string') return row;
  if (Array.isArray(row) && typeof row[0] === 'string') return row[0];
  if (row && typeof row === 'object' && !Array.isArray(row)) {
    const h = (row as { handler?: string }).handler;
    return typeof h === 'string' ? h : null;
  }
  return null;
}

function isOurUserEndHandler(row: unknown): boolean {
  const h = handlerOf(row);
  if (!h) return false;
  return VIEWING_REPORTS_TRIGGER_MARKERS.some((m) => h.includes(m));
}
