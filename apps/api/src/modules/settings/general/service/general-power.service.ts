import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { AuditService } from '../../../audit/audit.service';

export type HostPowerAction = 'reboot' | 'shutdown';

const ACTION_LABEL: Record<HostPowerAction, string> = {
  reboot: 'إعادة تشغيل',
  shutdown: 'إيقاف تشغيل',
};

/** تأخير قصير لإرجاع الاستجابة قبل بدء الأمر */
const SCHEDULE_DELAY_MS = 2500;

@Injectable()
export class GeneralPowerService {
  private readonly logger = new Logger(GeneralPowerService.name);
  private pending: HostPowerAction | null = null;

  constructor(private readonly audit: AuditService) {}

  async schedule(action: HostPowerAction, actorId: string) {
    if (this.pending) {
      throw new InternalServerErrorException(
        `أمر ${ACTION_LABEL[this.pending]} معلّق مسبقاً`,
      );
    }

    this.pending = action;

    await this.audit.log({
      actorId,
      action: action === 'reboot' ? 'reboot' : 'shutdown',
      resource: 'settings.general.host',
      resourceId: 'host',
      metadata: { action, delayMs: SCHEDULE_DELAY_MS },
    });

    setTimeout(() => {
      this.execute(action);
    }, SCHEDULE_DELAY_MS);

    return {
      success: true as const,
      action,
      message: `سيتم ${ACTION_LABEL[action]} الجهاز خلال ثوانٍ`,
      delayMs: SCHEDULE_DELAY_MS,
    };
  }

  private execute(action: HostPowerAction) {
    const args =
      action === 'reboot' ? (['-r', '+0'] as const) : (['-h', '+0'] as const);

    this.logger.warn(`تنفيذ ${action}: shutdown ${args.join(' ')}`);

    try {
      const child = spawn('shutdown', [...args], {
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', (err) => {
        this.logger.error(`فشل ${action}: ${err.message}`);
        this.pending = null;
      });
      child.unref();
    } catch (err) {
      this.pending = null;
      this.logger.error(
        `فشل إطلاق ${action}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
