import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { promisify } from 'util';
import type { NetworkDnsInfo } from '../../types/network.types';

const execFileAsync = promisify(execFile);

/** قراءة إعدادات DNS الحالية (systemd-resolved + resolv.conf) */
@Injectable()
export class DnsService {
  private readonly logger = new Logger(DnsService.name);

  async get(): Promise<NetworkDnsInfo> {
    const resolvConf = await this.readResolv();
    const fromFile = this.parseResolv(resolvConf);
    const fromResolved = await this.readResolved();

    return {
      mode: fromResolved ? 'systemd-resolved' : 'resolv.conf',
      servers:
        fromResolved?.servers.length ? fromResolved.servers : fromFile.servers,
      search:
        fromResolved?.search.length ? fromResolved.search : fromFile.search,
      resolvConf,
    };
  }

  private async readResolv(): Promise<string> {
    try {
      return await readFile('/etc/resolv.conf', 'utf8');
    } catch {
      return '';
    }
  }

  private parseResolv(text: string): { servers: string[]; search: string[] } {
    const servers: string[] = [];
    const search: string[] = [];
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (t.startsWith('nameserver ')) {
        servers.push(t.slice('nameserver '.length).trim());
      } else if (t.startsWith('search ') || t.startsWith('domain ')) {
        const parts = t.split(/\s+/).slice(1);
        search.push(...parts);
      }
    }
    return { servers, search };
  }

  private async readResolved(): Promise<{
    servers: string[];
    search: string[];
  } | null> {
    try {
      const { stdout } = await execFileAsync(
        'resolvectl',
        ['status'],
        { timeout: 8000, maxBuffer: 2 * 1024 * 1024 },
      );
      const servers: string[] = [];
      const search: string[] = [];
      for (const line of stdout.split('\n')) {
        const t = line.trim();
        if (t.startsWith('DNS Servers:')) {
          servers.push(
            ...t
              .slice('DNS Servers:'.length)
              .trim()
              .split(/\s+/)
              .filter(Boolean),
          );
        } else if (t.startsWith('DNS Domain:')) {
          search.push(
            ...t
              .slice('DNS Domain:'.length)
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .filter((x) => x !== '~.'),
          );
        } else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(t) && servers.length) {
          // continuation lines under DNS Servers
          servers.push(t);
        }
      }
      return { servers: [...new Set(servers)], search: [...new Set(search)] };
    } catch (err) {
      this.logger.debug(
        `resolvectl: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }
}
