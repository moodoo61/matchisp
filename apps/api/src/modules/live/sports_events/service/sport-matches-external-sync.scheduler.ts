import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SportMatchesExternalSyncService } from './sport-matches-external-sync.service';

/** فحص دوري قصير لدعم فترات المزامنة بالثواني */
const TICK_MS = 5 * 1000;

@Injectable()
export class SportMatchesExternalSyncScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SportMatchesExternalSyncScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly sync: SportMatchesExternalSyncService) {}

  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    try {
      await this.sync.syncIfDue();
    } catch (err) {
      this.logger.error(
        'فشل فحص مزامنة المباريات الخارجية',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
