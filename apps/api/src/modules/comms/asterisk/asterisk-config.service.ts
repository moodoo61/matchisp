import { Injectable, Logger } from '@nestjs/common';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { AsteriskStatusService } from './asterisk-status.service';

export type ExtensionConfigRow = {
  number: string;
  displayName: string;
  secret: string;
  enabled: boolean;
  context: string;
};

@Injectable()
export class AsteriskConfigService {
  private readonly logger = new Logger(AsteriskConfigService.name);

  constructor(private readonly status: AsteriskStatusService) {}

  private configDir() {
    return process.env.ASTERISK_CONFIG_DIR?.trim() || '/etc/asterisk';
  }

  async syncExtensions(rows: ExtensionConfigRow[]): Promise<void> {
    const enabled = rows.filter((r) => r.enabled);
    const pjsip = this.renderPjsip(enabled);
    const hints = this.renderHints(enabled);
    const dir = this.configDir();
    const pjsipPath = join(dir, 'pjsip_match_extensions.conf');
    const hintsPath = join(dir, 'extensions_match_hints.conf');

    await writeFile(pjsipPath, pjsip, 'utf8');
    await writeFile(hintsPath, hints, 'utf8');
    this.logger.log(
      `كُتبت إعدادات ${enabled.length} رقم إلى ${pjsipPath}`,
    );

    const ami = this.status.createClient();
    await ami.reloadPjsip();
    await ami.reloadDialplan();
  }

  private renderPjsip(rows: ExtensionConfigRow[]): string {
    const lines = [
      '; مولَّد تلقائياً من منصة Match — لا تعدّل يدوياً',
      `; ${new Date().toISOString()}`,
      '',
    ];
    for (const row of rows) {
      const caller = escapeConf(row.displayName);
      lines.push(
        `[${row.number}](endpoint-internal)`,
        `auth=${row.number}`,
        `aors=${row.number}`,
        `callerid=${caller} <${row.number}>`,
        `context=${row.context || 'from-internal'}`,
        '',
        `[${row.number}](auth-userpass)`,
        `username=${row.number}`,
        `password=${escapeConf(row.secret)}`,
        '',
        `[${row.number}](aor-single)`,
        '',
      );
    }
    return lines.join('\n');
  }

  private renderHints(rows: ExtensionConfigRow[]): string {
    const lines = [
      '; مولَّد تلقائياً من منصة Match — لا تعدّل يدوياً',
      '',
    ];
    for (const row of rows) {
      lines.push(`exten => ${row.number},hint,PJSIP/${row.number}`);
    }
    return `${lines.join('\n')}\n`;
  }
}

function escapeConf(value: string): string {
  return value.replace(/[\r\n;]/g, ' ').trim();
}
