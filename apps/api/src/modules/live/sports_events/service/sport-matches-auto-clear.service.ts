import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaLiveService } from '../../../../database/database.module';
import { AuditService } from '../../../audit/audit.service';
import { SportsEventsSettingsService } from './sports-events-settings.service';

const TICK_MS = 5 * 60 * 1000;

/**
 * جدول مسح أحداث اليوم:
 * - معطّل: لا شيء
 * - حذف الكل: يمسح كل المباريات كل N ساعة
 * - بعد ساعات: يحذف المباريات التي مضى على موعدها N ساعة
 */
@Injectable()
export class SportMatchesAutoClearService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SportMatchesAutoClearService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly prisma: PrismaLiveService,
    private readonly settings: SportsEventsSettingsService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    void this.runOnce();
    this.timer = setInterval(() => void this.runOnce(), TICK_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce() {
    if (this.running) return;
    this.running = true;
    try {
      const cfg = await this.settings.getSettings();
      if (!cfg.autoClearEnabled) return;

      const hoursMs = cfg.autoClearAfterHours * 60 * 60 * 1000;
      let deleted = 0;

      if (cfg.autoClearMode === 'all') {
        const last = cfg.lastFullClearAt
          ? Date.parse(cfg.lastFullClearAt)
          : NaN;
        const due =
          !Number.isFinite(last) || Date.now() - last >= hoursMs;
        if (!due) return;

        const result = await this.prisma.sportMatch.deleteMany({});
        deleted = result.count;
        await this.settings.persistSettings({
          ...cfg,
          lastFullClearAt: new Date().toISOString(),
        });
      } else {
        const cutoff = new Date(Date.now() - hoursMs);
        const result = await this.prisma.sportMatch.deleteMany({
          where: { kickoffAt: { lt: cutoff } },
        });
        deleted = result.count;
      }

      if (deleted > 0) {
        this.logger.log(
          `مسح تلقائي لأحداث اليوم: حُذف ${deleted} (وضع=${cfg.autoClearMode}, ساعات=${cfg.autoClearAfterHours})`,
        );
        await this.audit.log({
          action: 'auto_clear',
          resource: 'live.sports_events.match',
          metadata: {
            mode: cfg.autoClearMode,
            afterHours: cfg.autoClearAfterHours,
            deleted,
          },
        });
      } else if (cfg.autoClearMode === 'all') {
        this.logger.debug('مسح كامل مستحق — لا مباريات للحذف');
      }
    } catch (err) {
      this.logger.error(
        'فشل المسح التلقائي لأحداث اليوم',
        err instanceof Error ? err.stack : String(err),
      );
    } finally {
      this.running = false;
    }
  }
}
