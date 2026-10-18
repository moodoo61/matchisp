import { Injectable, Logger } from '@nestjs/common';
import { AmiClient } from './ami.client';

export type AsteriskStatusDto = {
  connected: boolean;
  version: string | null;
  startupDate: string | null;
  lastReloadDate: string | null;
  callsActive: number | null;
  callsProcessed: number | null;
  message: string;
};

@Injectable()
export class AsteriskStatusService {
  private readonly logger = new Logger(AsteriskStatusService.name);

  createClient(): AmiClient {
    const host = process.env.ASTERISK_AMI_HOST?.trim() || '127.0.0.1';
    const port = Number(process.env.ASTERISK_AMI_PORT || 5038);
    const username = process.env.ASTERISK_AMI_USER?.trim() || 'match';
    const secret =
      process.env.ASTERISK_AMI_SECRET?.trim() ||
      process.env.ASTERISK_AMI_PASSWORD?.trim() ||
      '';
    if (!secret) {
      throw new Error('ASTERISK_AMI_SECRET غير مضبوط');
    }
    return new AmiClient(host, port, username, secret);
  }

  async getStatus(): Promise<AsteriskStatusDto> {
    try {
      const ami = this.createClient();
      const ok = await ami.ping();
      if (!ok) {
        return {
          connected: false,
          version: null,
          startupDate: null,
          lastReloadDate: null,
          callsActive: null,
          callsProcessed: null,
          message: 'تعذر الاتصال بـ AMI',
        };
      }
      const [version, coreRaw] = await Promise.all([
        ami.coreShowVersion().catch(() => null),
        ami.coreStatus().catch(() => ({}) as Record<string, string>),
      ]);
      const core = coreRaw as Record<string, string>;
      return {
        connected: true,
        version,
        startupDate: core.CoreStartupDate
          ? `${core.CoreStartupDate} ${core.CoreStartupTime ?? ''}`.trim()
          : null,
        lastReloadDate: core.CoreReloadDate
          ? `${core.CoreReloadDate} ${core.CoreReloadTime ?? ''}`.trim()
          : null,
        callsActive: core.CoreCurrentCalls
          ? Number(core.CoreCurrentCalls)
          : null,
        callsProcessed: core.CoreProcessedCalls
          ? Number(core.CoreProcessedCalls)
          : null,
        message: 'Asterisk متصل عبر AMI',
      };
    } catch (err) {
      this.logger.warn(
        `فشل حالة Asterisk: ${err instanceof Error ? err.message : err}`,
      );
      return {
        connected: false,
        version: null,
        startupDate: null,
        lastReloadDate: null,
        callsActive: null,
        callsProcessed: null,
        message: err instanceof Error ? err.message : 'فشل الاتصال بـ Asterisk',
      };
    }
  }
}
