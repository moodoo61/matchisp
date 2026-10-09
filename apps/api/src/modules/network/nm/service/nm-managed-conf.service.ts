import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { IFACE_NAME_RE } from '../../constants/network-safety';
import { NmcliService } from './nmcli.service';

const CONF_DIR = '/etc/NetworkManager/conf.d';
const CONF_FILE = '99-match-managed-ifaces.conf';
const STATE_MARKER = '# match-managed-ifaces:';

/**
 * يتجاوز 10-globally-managed-devices (unmanaged-devices=*) على Debian/Ubuntu
 * بإضافة except:interface-name للمنفذ حتى يبقى تحت NM بعد الإقلاع.
 */
@Injectable()
export class NmManagedConfService {
  private readonly logger = new Logger(NmManagedConfService.name);

  constructor(private readonly nmcli: NmcliService) {}

  async ensureManagedPersistent(ifName: string): Promise<void> {
    if (!IFACE_NAME_RE.test(ifName)) return;

    try {
      await mkdir(CONF_DIR, { recursive: true });
      const pinned = await this.readPinned();
      if (pinned.includes(ifName)) return;

      const next = [...pinned, ifName].sort();
      await this.writePinned(next);
      await this.nmcli.run(['general', 'reload']);
      this.logger.log(`أُضيف ${ifName} لاستثناءات NetworkManager الدائمة`);
    } catch (err) {
      this.logger.warn(
        `تعذر تثبيت managed لـ ${ifName}: ${this.nmcli.errMsg(err)}`,
      );
    }
  }

  async listPinned(): Promise<string[]> {
    return this.readPinned();
  }

  private async readPinned(): Promise<string[]> {
    const path = join(CONF_DIR, CONF_FILE);
    try {
      const text = await readFile(path, 'utf8');
      for (const line of text.split('\n')) {
        if (!line.startsWith(STATE_MARKER)) continue;
        return line
          .slice(STATE_MARKER.length)
          .trim()
          .split(',')
          .map((s) => s.trim())
          .filter((s) => IFACE_NAME_RE.test(s));
      }
      return [];
    } catch {
      return [];
    }
  }

  private async writePinned(ifNames: string[]): Promise<void> {
    const excepts = [
      'except:type:wifi',
      'except:type:gsm',
      'except:type:cdma',
      ...ifNames.map((n) => `except:interface-name:${n}`),
    ];
    const body = [
      '# Managed by ISP Admin network module — do not edit by hand',
      `${STATE_MARKER}${ifNames.join(',')}`,
      '[keyfile]',
      `unmanaged-devices=*,${excepts.join(',')}`,
      '',
    ].join('\n');
    await writeFile(join(CONF_DIR, CONF_FILE), body, {
      encoding: 'utf8',
      mode: 0o644,
    });
  }
}
